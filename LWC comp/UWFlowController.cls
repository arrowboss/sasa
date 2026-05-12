/**
 * UWFlowController.cls  —  final production version
 *
 * Fetch strategy per object:
 *   Loan__c                  → direct (IS the record)
 *   Client__c                → Loan__c.Client__c lookup
 *   Business_Owner__c        → Loan__c.Business_Owner__c lookup
 *   Credit_Memo__c           → reverse (Credit_Memo__c.Loan__c = loanId) latest CreatedDate
 *   Site_Visit__c            → reverse (Site_Visit__c.Loan__c  = loanId) latest CreatedDate
 *   Employee_Demographics__c → reverse, ALL rows (custom table)
 *
 * Save strategy:
 *   UPDATE only — if no Id found for an object, skip it entirely (no INSERT)
 *   Employee_Demographics__c → each row updated individually by its own Id
 */
public with sharing class UWFlowController {

    // ── Inner types ──────────────────────────────────────────────

    public class PicklistOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

    public class FieldInfo {
        @AuraEnabled public String  apiName;
        @AuraEnabled public String  label;
        @AuraEnabled public String  fieldType;
        @AuraEnabled public Boolean required;
        @AuraEnabled public Boolean updateable;
        @AuraEnabled public String  objectApiName;
        @AuraEnabled public List<PicklistOption> picklistOptions;
    }

    public class SectionResult {
        @AuraEnabled public String          sectionKey;
        @AuraEnabled public String          objectApiName;
        @AuraEnabled public List<FieldInfo> fields;
    }

    public class FlowDataResult {
        @AuraEnabled public List<SectionResult>              sections;
        @AuraEnabled public Map<String, Map<String, Object>> recordValues;
        @AuraEnabled public Map<String, String>              recordIds;
        @AuraEnabled public List<Map<String, Object>>        employeeDemoRows;
        @AuraEnabled public Boolean                          hasSiteVisit;
        @AuraEnabled public Boolean                          hasCreditMemo;
    }

    // ── getFlowData ──────────────────────────────────────────────

    @AuraEnabled(cacheable=false)
    public static FlowDataResult getFlowData(String loanId, String configJson) {

        List<Object> rawList = (List<Object>) JSON.deserializeUntyped(configJson);

        FlowDataResult res   = new FlowDataResult();
        res.sections         = new List<SectionResult>();
        res.recordValues     = new Map<String, Map<String, Object>>();
        res.recordIds        = new Map<String, String>();
        res.recordIds.put('Loan__c', loanId);
        res.employeeDemoRows = new List<Map<String, Object>>();
        res.hasSiteVisit     = false;
        res.hasCreditMemo    = false;

        Map<String, Set<String>> fieldsToQuery  = new Map<String, Set<String>>();
        Map<String, String>      normalLookup   = new Map<String, String>(); // obj → lookup field on Loan
        Map<String, String>      reverseLatest  = new Map<String, String>(); // obj → lookup field on child

        fieldsToQuery.put('Loan__c', new Set<String>{ 'Id' });

        // Pass 1 — describe field sets, build field lists
        for (Object rawEntry : rawList) {
            Map<String, Object> cfg = (Map<String, Object>) rawEntry;
            String sKey       = (String)  cfg.get('key');
            String fsName     = (String)  cfg.get('fieldSetName');
            String objName    = (String)  cfg.get('objectApiName');
            String lookupFld  = (String)  cfg.get('lookupField');
            Boolean isReverse = cfg.get('reverseLookup') == true;
            Boolean isLatest  = cfg.get('reverseLatest')  == true;

            if (!fieldsToQuery.containsKey(objName)) {
                fieldsToQuery.put(objName, new Set<String>{ 'Id' });
            }

            if (String.isNotBlank(lookupFld)) {
                if (isReverse && isLatest && !reverseLatest.containsKey(objName)) {
                    reverseLatest.put(objName, lookupFld);
                } else if (!isReverse && objName != 'Loan__c' && !normalLookup.containsKey(objName)) {
                    normalLookup.put(objName, lookupFld);
                    fieldsToQuery.get('Loan__c').add(lookupFld);
                }
            }

            SectionResult sr = new SectionResult();
            sr.sectionKey    = sKey;
            sr.objectApiName = objName;
            sr.fields        = new List<FieldInfo>();

            Schema.SObjectType sot = Schema.getGlobalDescribe().get(objName);
            if (sot != null && String.isNotBlank(fsName)) {
                Schema.DescribeSObjectResult     dor   = sot.getDescribe();
                Map<String, Schema.FieldSet>     fsMap = dor.fieldSets.getMap();
                Map<String, Schema.SObjectField> fMap  = dor.fields.getMap();

                if (fsMap.containsKey(fsName)) {
                    for (Schema.FieldSetMember m : fsMap.get(fsName).getFields()) {
                        String fApi = m.getFieldPath();
                        FieldInfo fi        = new FieldInfo();
                        fi.apiName          = fApi;
                        fi.label            = m.getLabel();
                        fi.fieldType        = String.valueOf(m.getType());
                        fi.required         = m.getRequired() || m.getDbRequired();
                        fi.objectApiName    = objName;
                        fi.picklistOptions  = new List<PicklistOption>();

                        Schema.SObjectField sff = fMap.get(fApi.toLowerCase());
                        if (sff != null) {
                            Schema.DescribeFieldResult dfr = sff.getDescribe();
                            fi.updateable = dfr.isUpdateable();
                            Schema.DisplayType dt = m.getType();
                            if (dt == Schema.DisplayType.PICKLIST || dt == Schema.DisplayType.MULTIPICKLIST) {
                                PicklistOption blank = new PicklistOption();
                                blank.label = '-- None --';
                                blank.value = '';
                                fi.picklistOptions.add(blank);
                                for (Schema.PicklistEntry ple : dfr.getPicklistValues()) {
                                    if (ple.isActive()) {
                                        PicklistOption po = new PicklistOption();
                                        po.label = ple.getLabel();
                                        po.value = ple.getValue();
                                        fi.picklistOptions.add(po);
                                    }
                                }
                            }
                        } else {
                            fi.updateable = false;
                        }
                        sr.fields.add(fi);
                        fieldsToQuery.get(objName).add(fApi);
                    }
                }
            }
            res.sections.add(sr);
        }

        // Pass 2 — query Loan__c
        Set<String> loanFlds = fieldsToQuery.get('Loan__c');
        String loanQ = 'SELECT ' + String.join(new List<String>(loanFlds), ', ')
                     + ' FROM Loan__c WHERE Id = :loanId LIMIT 1';
        List<SObject> loanRows = Database.query(loanQ);
        if (loanRows.isEmpty()) return res;

        SObject loan = loanRows[0];
        Map<String, Object> loanVals = new Map<String, Object>();
        for (String f : loanFlds) {
            Object v = loan.get(f);
            if (v != null) loanVals.put(f, v);
        }
        res.recordValues.put('Loan__c', loanVals);

        // Pass 3 — normal lookups (Client__c, Business_Owner__c)
        for (String objName : normalLookup.keySet()) {
            Object relIdRaw = loan.get(normalLookup.get(objName));
            if (relIdRaw == null) continue;
            Id relId = (Id) relIdRaw;
            res.recordIds.put(objName, String.valueOf(relId));

            Set<String> relFlds = fieldsToQuery.containsKey(objName)
                ? fieldsToQuery.get(objName) : new Set<String>{ 'Id' };
            String relQ = 'SELECT ' + String.join(new List<String>(relFlds), ', ')
                        + ' FROM ' + objName + ' WHERE Id = :relId LIMIT 1';
            List<SObject> relRows = Database.query(relQ);
            if (!relRows.isEmpty()) {
                Map<String, Object> relVals = new Map<String, Object>();
                for (String f : relFlds) {
                    Object v = relRows[0].get(f);
                    if (v != null) relVals.put(f, v);
                }
                res.recordValues.put(objName, relVals);
            }
        }

        // Pass 4 — reverse latest (Site_Visit__c, Credit_Memo__c)
        for (String objName : reverseLatest.keySet()) {
            String childFld = reverseLatest.get(objName);
            Set<String> relFlds = fieldsToQuery.containsKey(objName)
                ? fieldsToQuery.get(objName) : new Set<String>{ 'Id' };
            String relQ = 'SELECT ' + String.join(new List<String>(relFlds), ', ')
                        + ' FROM ' + objName
                        + ' WHERE ' + childFld + ' = :loanId'
                        + ' ORDER BY CreatedDate DESC LIMIT 1';
            List<SObject> relRows = Database.query(relQ);
            if (!relRows.isEmpty()) {
                Id relId = (Id) relRows[0].get('Id');
                res.recordIds.put(objName, String.valueOf(relId));
                Map<String, Object> relVals = new Map<String, Object>();
                for (String f : relFlds) {
                    Object v = relRows[0].get(f);
                    if (v != null) relVals.put(f, v);
                }
                res.recordValues.put(objName, relVals);
                if (objName == 'Site_Visit__c')  res.hasSiteVisit  = true;
                if (objName == 'Credit_Memo__c') res.hasCreditMemo = true;
            }
        }

        // Pass 5 — Employee_Demographics__c ALL rows
        List<Employee_Demographics__c> empRows = [
            SELECT Id, Race_And_Ethinicity__c,
                   Native_American__c, Asian_Pacific_Islander__c,
                   Caucasian__c, African_American__c, Latinx__c, Other__c, Client__c
            FROM   Employee_Demographics__c
            WHERE  Loan__c = :loanId
            ORDER BY CreatedDate ASC
        ];
        for (Employee_Demographics__c emp : empRows) {
            Map<String, Object> row = new Map<String, Object>();
            row.put('Id',                        String.valueOf(emp.Id));
            row.put('Race_And_Ethinicity__c',    emp.Race_And_Ethinicity__c);
            row.put('Native_American__c',        emp.Native_American__c);
            row.put('Asian_Pacific_Islander__c', emp.Asian_Pacific_Islander__c);
            row.put('Caucasian__c',              emp.Caucasian__c);
            row.put('African_American__c',       emp.African_American__c);
            row.put('Latinx__c',                 emp.Latinx__c);
            row.put('Other__c',                  emp.Other__c);
            row.put('Client__c', emp.Client__c == null ? null : String.valueOf(emp.Client__c));
            res.employeeDemoRows.add(row);
        }

        return res;
    }

    // ── saveAllData ──────────────────────────────────────────────
    // dataJson    = { "Object__c": { "Field__c": value, "Id": "recordId" }, ... }
    // empDemoJson = [ { "Id": "xxx", "Native_American__c": 1, ... }, ... ]

    @AuraEnabled
    public static void saveAllData(String dataJson, String empDemoJson) {
        List<SObject> toUpdate = new List<SObject>();

        // Field-set objects
        Map<String, Object> byObj = (Map<String, Object>) JSON.deserializeUntyped(dataJson);
        for (String objApiName : byObj.keySet()) {
            Schema.SObjectType sot = Schema.getGlobalDescribe().get(objApiName);
            if (sot == null) continue;

            Map<String, Schema.SObjectField> fMap   = sot.getDescribe().fields.getMap();
            Map<String, Object>              fields = (Map<String, Object>) byObj.get(objApiName);

            SObject rec   = sot.newSObject();
            Boolean hasId = false;

            for (String fName : fields.keySet()) {
                Object raw = fields.get(fName);
                if (fName == 'Id') {
                    String sid = raw == null ? '' : String.valueOf(raw).trim();
                    if (String.isNotBlank(sid) && sid != 'null') {
                        rec.Id = (Id) sid;
                        hasId  = true;
                    }
                    continue;
                }
                Schema.SObjectField sff = fMap.get(fName.toLowerCase());
                if (sff == null || !sff.getDescribe().isUpdateable()) continue;
                try {
                    Object coerced = coerce(raw, sff.getDescribe().getType());
                    if (coerced != null) rec.put(fName, coerced);
                } catch (Exception ex) {
                    System.debug(LoggingLevel.WARN, 'UWFlow skip [' + fName + ']: ' + ex.getMessage());
                }
            }
            if (hasId) toUpdate.add(rec); // UPDATE only
        }

        // Employee Demographics rows
        if (String.isNotBlank(empDemoJson) && empDemoJson != '[]') {
            List<Object> empRows = (List<Object>) JSON.deserializeUntyped(empDemoJson);
            String[] numFlds = new String[]{
                'Native_American__c','Asian_Pacific_Islander__c',
                'Caucasian__c','African_American__c','Latinx__c','Other__c'
            };
            for (Object rawRow : empRows) {
                Map<String, Object> row = (Map<String, Object>) rawRow;
                String rowId = row.containsKey('Id') ? String.valueOf(row.get('Id')) : null;
                if (String.isBlank(rowId) || rowId == 'null') continue;

                Employee_Demographics__c rec = new Employee_Demographics__c(Id = (Id) rowId);
                for (String f : numFlds) {
                    Object raw = row.get(f);
                    if (raw == null) continue;
                    String s = String.valueOf(raw).trim();
                    if (String.isBlank(s) || s == 'null') continue;
                    try { rec.put(f, Decimal.valueOf(s)); }
                    catch (Exception ex) {
                        System.debug(LoggingLevel.WARN, 'UWFlow ED skip [' + f + ']: ' + ex.getMessage());
                    }
                }
                toUpdate.add(rec);
            }
        }

        if (!toUpdate.isEmpty()) update toUpdate;
    }

    // ── Type coercion ────────────────────────────────────────────
    private static Object coerce(Object raw, Schema.DisplayType dt) {
        if (raw == null) return null;
        String s = String.valueOf(raw).trim();
        if (s == '' || s == 'null') return null;
        if      (dt == Schema.DisplayType.BOOLEAN)  return Boolean.valueOf(s);
        else if (dt == Schema.DisplayType.INTEGER)  return Integer.valueOf(Decimal.valueOf(s));
        else if (dt == Schema.DisplayType.DOUBLE
              || dt == Schema.DisplayType.CURRENCY
              || dt == Schema.DisplayType.PERCENT)  return Decimal.valueOf(s);
        else if (dt == Schema.DisplayType.DATE)     return Date.valueOf(s);
        else if (dt == Schema.DisplayType.DATETIME) {
            String n = s.replace('T', ' ').substringBefore('.');
            if (!n.contains(' ')) n += ' 00:00:00';
            return Datetime.valueOf(n);
        }
        else if (dt == Schema.DisplayType.REFERENCE) {
            return String.isNotBlank(s) ? (Id) s : null;
        }
        return s;
    }
}