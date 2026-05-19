import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent }                     from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent }             from 'lightning/actions';
import { CurrentPageReference }               from 'lightning/navigation';
import getFlowData  from '@salesforce/apex/UWFlowController.getFlowData';
import saveAllData  from '@salesforce/apex/UWFlowController.saveAllData';
import getGuarantorRows from '@salesforce/apex/UWFlowController.getGuarantorRows';
import getGuarantorTypeOptions from '@salesforce/apex/UWFlowController.getGuarantorTypeOptions';
/* ════════════════════════════════════════════════════════════════════
   FLOW CONFIG
   ════════════════════════════════════════════════════════════════════ */
const FLOW_CONFIG = [
    {
        page: 1,
        pageLabel: 'Analysis',
        sections: [
            {
    key: 'business_info',
    accordionLabel: 'Business Info',
    objectApiName: 'Client__c',
    fieldSetName: 'Business_Info',

    additionalFieldSets: [
        {
            objectApiName: 'Loan__c',
            fieldSetName: 'Business_Info'
        }
    ],

    lookupField: 'Client__c',
    reverseLookup: false,
    reverseLatest: false,
    isEmpDemo: false
},
            {
                key: 'employee_demographics', accordionLabel: 'Employee Demographics',
                objectApiName: 'Employee_Demographics__c', fieldSetName: '',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: false, isEmpDemo: true
            },
            {
                key: 'principal_1', accordionLabel: 'Principal 1',
                objectApiName: 'Business_Owner__c', fieldSetName: 'Principal_1',
                lookupField: 'Business_Owner__c', reverseLookup: false, reverseLatest: false, isEmpDemo: false
            },
            {
                key: 'eligibility_check', accordionLabel: 'Eligibility Check',
                objectApiName: 'Loan__c', fieldSetName: 'Eligibility_Check',
                lookupField: null, reverseLookup: false, reverseLatest: false, isEmpDemo: false
            },
            {
                key: 'borrower_ownership', accordionLabel: 'Borrower Ownership',
                objectApiName: 'Guarantor_Relationship__c', fieldSetName: null,
                lookupField: null, reverseLookup: false, reverseLatest: false,
                isEmpDemo: false, isGuarantorTable: true, guarantorType: 'borrower'
            },
            {
                key: 'guarantors', accordionLabel: 'Guarantors',
                objectApiName: 'Guarantor_Relationship__c', fieldSetName: null,
                lookupField: null, reverseLookup: false, reverseLatest: false,
                isEmpDemo: false, isGuarantorTable: true, guarantorType: 'guarantor'
            },
            {
                // SBA section — fields hardcoded below, metadata fetched from Salesforce schema
                key: 'sba_required_info', accordionLabel: 'SBA Required Info',
                objectApiName: 'Loan__c', fieldSetName: null,
                lookupField: null, reverseLookup: false, reverseLatest: false,
                isEmpDemo: false, isHardcodedSBA: true
            }
        ]
    },
    {
        page: 2,
        pageLabel: 'Site Visit',
        sections: [
            {
                key: 'transaction_summary', accordionLabel: 'Transaction Summary',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Business_Background',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
           
            {
                key: 'business_background', accordionLabel: 'Business Background',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Business_Background',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
            {
                key: 'lease', accordionLabel: 'Lease',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Lease',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
              {
                key: 'personal_guarantors', accordionLabel: 'Personal Guarantors',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Personal_Guarantors',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
             {
                key: 'management_experience', accordionLabel: 'Management Experience',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Management_Experience',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
             {
                key: 'business_debt_schedule', accordionLabel: 'Business Debt Schedule',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Business_Debt_Schedule',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
            {
                key: 'cash_flow_analysis', accordionLabel: 'Cash Flow Analysis',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Cash_Flow_Analysis',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
            {
                key: 'debt_service_coverage', accordionLabel: 'Debt Service Coverage',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Debt_Service_Coverage',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
            {
                key: 'site_visit', accordionLabel: 'Site Visit',
                objectApiName: 'Site_Visit__c', fieldSetName: 'Site_Visit',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
            {
                key: 'recommendation', accordionLabel: 'Recommendation',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Recommendation',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
              {
                key: 'technical_assistance', accordionLabel: 'Technical Assistance',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Technical_Assistance',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            },
              {
                key: 'policy_exceptions', accordionLabel: 'Policy Exceptions',
                objectApiName: 'Credit_Memo__c', fieldSetName: 'Policy_Exceptions',
                lookupField: 'Loan__c', reverseLookup: true, reverseLatest: true, isEmpDemo: false
            }
            
        ]
    },
    {
        page: 3,
        pageLabel: 'Credit Memo',
        sections: [
            {
                key: 'credit_analysis_details', accordionLabel: 'Credit Analysis Details',
                objectApiName: 'Loan__c', fieldSetName: 'Credit_Analysis_Details',
                lookupField: null, reverseLookup: false, reverseLatest: false, isEmpDemo: false
            },
            {
                key: 'funding_source_1', accordionLabel: 'Funding Source 1',
                objectApiName: 'Loan__c', fieldSetName: 'Funding_Source_1',
                lookupField: null, reverseLookup: false, reverseLatest: false, isEmpDemo: false
            },
            {
                key: 'funding_source_2', accordionLabel: 'Funding Source 2',
                objectApiName: 'Loan__c', fieldSetName: 'Funding_Source_2',
                lookupField: null, reverseLookup: false, reverseLatest: false, isEmpDemo: false
            }
        ]
    }
];

// ── SBA hardcoded field definitions ──────────────────────────────────────────
// These are the exact fields shown in the SBA section.
// objectApiName + apiName must match what Apex fetches in _sbaFieldMeta.
// Types/labels/picklist values come from Salesforce schema via Apex — not hardcoded here.
const SBA_FIELDS = [
    // Always shown
    { objectApiName: 'Loan__c',       apiName: 'Is_this_SBA_Funded__c',                  isTrigger: true  },
    // Shown only when Is_this_SBA_Funded__c === 'Yes'
    { objectApiName: 'Client__c',     apiName: 'Naisc_Code__c',                           isTrigger: false },
    { objectApiName: 'Credit_Memo__c',apiName: 'CM_Type_of_Business__c',                  isTrigger: false },
    { objectApiName: 'Credit_Memo__c',apiName: 'CM_Size_Standard__c',                     isTrigger: false },
    { objectApiName: 'Loan__c',       apiName: 'Is_Business_on_SAM_gov_Exclusions_List__c', isTrigger: false }
];

const TEXT_TYPES     = new Set(['STRING','EMAIL','PHONE','URL','ID']);
const NUMBER_TYPES   = new Set(['DOUBLE','CURRENCY','PERCENT','INTEGER','LONG']);
const TEXTAREA_TYPES = new Set(['TEXTAREA','ENCRYPTEDSTRING']);
const PLACEHOLDER    = 'REPLACE_FIELDSET';

export default class UnderwritingFlow extends LightningElement {

    @api recordId;
    _loaded        = false;

    // SBA field metadata fetched from Apex alongside main data
    // { 'Loan__c__Is_this_SBA_Funded__c': FieldInfo, ... }
    _sbaFieldMeta  = {};

    @track currentPage    = 1;
    @track isLoading      = true;
    @track isSaving       = false;
    @track hasError       = false;
    @track errorMessage   = '';
    @track activeSections = [];
    @track empDemoRows    = [];
    @track borrowerRows  = [];
    @track guarantorRows = [];
    @track guarantorTypeOptions = [];
    @track _tick          = 0;
    isDirty = false;
    _sections      = [];
    _formData      = {};
    _recordIds     = {};
    _hasSiteVisit  = false;
    _hasCreditMemo = false;


// Page visibility — drives the 3 separate accordion instances
get isPage1() { return this.currentPage === 1; }
get isPage2() { return this.currentPage === 2; }
get isPage3() { return this.currentPage === 3; }

// Tab classes for custom nav bar — active tab gets dark style, others get light
get pathClass1() {
    if (this.currentPage === 1) return 'slds-path__item slds-is-current slds-is-active';
    if (this.currentPage > 1)  return 'slds-path__item slds-is-complete';
    return 'slds-path__item slds-is-incomplete';
}

get pathClass2() {
    if (this.currentPage === 2) return 'slds-path__item slds-is-current slds-is-active';
    if (this.currentPage > 2)  return 'slds-path__item slds-is-complete';
    return 'slds-path__item slds-is-incomplete';
}

get pathClass3() {
    if (this.currentPage === 3) return 'slds-path__item slds-is-current slds-is-active';
    if (this.currentPage > 3)  return 'slds-path__item slds-is-complete';
    return 'slds-path__item slds-is-incomplete';
}
    // ── Wire: get recordId from page URL state ──────────────────
    @wire(CurrentPageReference)
    wiredPageRef(pageRef) {
        if (!pageRef) return;
        const rid = pageRef?.state?.c__loanId
                 || pageRef?.state?.c__recordId
                 || pageRef?.state?.recordId
                 || this.recordId;
        if (rid && !this._loaded) {
            this._loaded  = true;
            this.recordId = rid;
            this._load();
        }
    }


    

    // ── Load ────────────────────────────────────────────────────
    _load() {
        this.isLoading = true;
        this.hasError  = false;


        const configPayload = [];

        // Normal field-set sections (excludes SBA hardcoded, empDemo, placeholders)
        FLOW_CONFIG.forEach(page => {
    page.sections.forEach(section => {

        // Main field set
        if (
            !section.isEmpDemo &&
            !section.isHardcodedSBA &&
            section.fieldSetName &&
            section.fieldSetName !== PLACEHOLDER &&
            section.fieldSetName !== ''
        ) {
            configPayload.push({
                key: section.key,
                fieldSetName: section.fieldSetName,
                objectApiName: section.objectApiName,
                lookupField: section.lookupField || null,
                reverseLookup: section.reverseLookup || false,
                reverseLatest: section.reverseLatest || false
            });
        }

        // Additional field sets
        if (section.additionalFieldSets) {
            section.additionalFieldSets.forEach(extra => {
                configPayload.push({
                    key: section.key, // same key so fields appear in same accordion
                    fieldSetName: extra.fieldSetName,
                    objectApiName: extra.objectApiName,
                    lookupField: null,
                    reverseLookup: false,
                    reverseLatest: false
                });
            });
        }
    });
});

        // Also tell Apex to fetch SBA field metadata + values
        // We piggyback them as extra "sections" with a special key prefix
        const sbaPayload = SBA_FIELDS.map(f => ({
            key:           `sba__${f.objectApiName}__${f.apiName}`,
            fieldSetName:  null,       // no fieldset — single field fetch
            objectApiName: f.objectApiName,
            singleField:   f.apiName,  // Apex reads this to fetch just one field
            lookupField:   f.objectApiName === 'Client__c'      ? 'Client__c'
                         : f.objectApiName === 'Credit_Memo__c' ? 'Loan__c'
                         : null,
            reverseLookup: f.objectApiName === 'Credit_Memo__c',
            reverseLatest: f.objectApiName === 'Credit_Memo__c'
        }));

Promise.all([
    getFlowData({ loanId: this.recordId, configJson: JSON.stringify([...configPayload, ...sbaPayload]) }),
    getGuarantorRows({ loanId: this.recordId }),
    getGuarantorTypeOptions()
])
.then(([data, gData, gtOptions]) => {
    this._recordIds     = { ...(data.recordIds    || {}) };
    this._hasSiteVisit  = data.hasSiteVisit  || false;
    this._hasCreditMemo = data.hasCreditMemo || false;

    const allSections = data.sections || [];
    this._sections    = allSections.filter(s => !s.sectionKey.startsWith('sba__'));

    const sbaMeta = {};
    allSections
        .filter(s => s.sectionKey.startsWith('sba__'))
        .forEach(s => {
            (s.fields || []).forEach(f => {
                sbaMeta[`${f.objectApiName}__${f.apiName}`] = f;
            });
        });
    this._sbaFieldMeta = sbaMeta;

    const seeded = {};
    for (const [obj, vals] of Object.entries(data.recordValues || {})) {
        seeded[obj] = { ...vals };
    }
    this._formData = seeded;

    this.empDemoRows   = (data.employeeDemoRows || []).map(r => ({ ...r }));
    this.borrowerRows  = (gData.borrowerRows  || []).map(r => ({ ...r }));
    this.guarantorRows = (gData.guarantorRows || []).map(r => ({ ...r }));
    this.guarantorTypeOptions = (gtOptions || []).map(o => ({ label: o.label, value: o.value }));

    this._openAllForPage(1);
    this.isLoading = false;
    this._tick++;
})
.catch(err => {
    this.isLoading    = false;
    this.hasError     = true;
    this.errorMessage = this._msg(err);
});
    }

    onRetry() { this._load(); }

    // ── Computed getters ────────────────────────────────────────
    get isReady()          { return !this.isLoading && !this.hasError; }
    get isFirstPage()      { return this.currentPage === 1; }
    get isLastPage()       { return this.currentPage === FLOW_CONFIG.length; }
    get currentStepValue() { return String(this.currentPage); }
    get hasEmpDemoRows()   { return this.empDemoRows && this.empDemoRows.length > 0; }
 

    get currentSections() {
        void this._tick;
        const pageConf = FLOW_CONFIG.find(p => p.page === this.currentPage);
        if (!pageConf) return [];

        return pageConf.sections.map(s => {


            // ── Guarantor table sections ───────────────────────────
if (s.isGuarantorTable) {
    const rows = s.guarantorType === 'borrower'
        ? this.borrowerRows : this.guarantorRows;
   return {
    key: s.key,
    accordionLabel: s.accordionLabel,
    isEmpDemo: false,
    isEmpty: rows.length === 0,
    isFieldSet: false,
    isGuarantorTable: true,
    isBorrower: s.guarantorType === 'borrower',
    guarantorType: s.guarantorType,
    guarantorRows: rows,
    guarantorTypeOptions: this.guarantorTypeOptions,
    emptyMsg: 'No records found.'
};
}


            // ── Employee Demographics ──────────────────────────
            if (s.isEmpDemo) {
                return {
                    key: s.key, accordionLabel: s.accordionLabel,
                    isEmpDemo: true, isEmpty: false, isFieldSet: false, fields: []
                };
            }

            // ── SBA Required Info (hardcoded fields, schema-driven metadata) ──
            if (s.isHardcodedSBA) {
                const sbaVal = (this._formData?.Loan__c || {})['Is_this_SBA_Funded__c'];
                const fields = [];

                for (const def of SBA_FIELDS) {
                    // Conditional fields only show when SBA = Yes
                    if (def.isTrigger === false && sbaVal !== 'Yes') continue;

                    const metaKey = `${def.objectApiName}__${def.apiName}`;
                    const meta    = this._sbaFieldMeta[metaKey];
                    
if (meta) {
    const enriched = this._enrich(meta);

    // ✅ Make NAICS Code read-only ONLY in SBA section
    if (def.apiName === 'Naisc_Code__c' && def.objectApiName === 'Client__c') {
        enriched.isDisabled = true;
    }

    fields.push(enriched);
}

                }

                return {
                    key: s.key, accordionLabel: s.accordionLabel,
                    isEmpDemo: false,
                    isEmpty:   fields.length === 0,
                    isFieldSet: fields.length > 0,
                    emptyMsg:  'SBA field metadata not loaded.',
                    fields
                };
            }

            // ── Placeholder ────────────────────────────────────
            if (!s.fieldSetName || s.fieldSetName === PLACEHOLDER) {
                return {
                    key: s.key, accordionLabel: s.accordionLabel,
                    isEmpDemo: false, isEmpty: true, isFieldSet: false,
                    emptyMsg: 'Field set not yet configured for this section.', fields: []
                };
            }

            // ── Reverse-latest: show empty if no record ────────
           if (s.reverseLatest) {
    // Credit_Memo sections: hide if no record
    if (s.objectApiName === 'Credit_Memo__c' && !this._hasCreditMemo) {
        return {
            key: s.key, accordionLabel: s.accordionLabel,
            isEmpDemo: false, isEmpty: true, isFieldSet: false,
            emptyMsg: 'No records found for this loan.', fields: []
        };
    }
    // Site_Visit__c: ALWAYS show fields — create new record on save if none exists
}

            // ── Normal field-set section ───────────────────────
            const metas = this._sections.filter(m => m.sectionKey === s.key);

const fields = metas.flatMap(meta =>
    (meta.fields || []).map(f => this._enrich(f))
);

            return {
                key: s.key, accordionLabel: s.accordionLabel,
                isEmpDemo: false,
                isEmpty:   fields.length === 0,
                isFieldSet: fields.length > 0,
                emptyMsg:  'No fields returned from this field set.',
                fields
            };
        });
    }

   // ── Enrich: add type flags + live value ─────────────────────
    _enrich(f) {
        const ft  = f.fieldType || 'STRING';
        const isLookup = ft === 'REFERENCE';
        const obj = f.objectApiName;
        const stored = (this._formData[obj] || {})[f.apiName];
        const val    = stored !== undefined ? stored : null;

       // const isText          = TEXT_TYPES.has(ft);
        const isText = TEXT_TYPES.has(ft) && !isLookup;
        const isNumber        = NUMBER_TYPES.has(ft);
        const isBoolean       = ft === 'BOOLEAN';
        const isDate          = ft === 'DATE';
        const isDatetime      = ft === 'DATETIME';
        const isTextarea      = TEXTAREA_TYPES.has(ft);
        const isPicklist      = ft === 'PICKLIST';
        const isMultiPicklist = ft === 'MULTIPICKLIST';

        const multiVal = isMultiPicklist
            ? (val ? String(val).split(';').map(v => v.trim()).filter(Boolean) : []) : [];
        const boolVal  = isBoolean ? (val === true || val === 'true') : false;
        const value    = (isBoolean || isMultiPicklist) ? '' : (val == null ? '' : String(val));
        const colCss   = (isTextarea || isMultiPicklist)
            ? 'slds-col slds-size_1-of-1'
            : 'slds-col slds-size_1-of-1 slds-medium-size_1-of-2';
        const inputType = ft === 'EMAIL' ? 'email' : ft === 'PHONE' ? 'tel' : ft === 'URL' ? 'url' : 'text';
        const formatter = ft === 'CURRENCY' ? 'currency' : ft === 'PERCENT' ? 'percent-fixed' : 'decimal';

        return {
            uid: `${obj}__${f.apiName}`, apiName: f.apiName, label: f.label,
            required: f.required, isDisabled: f.updateable === false,
            objectApiName: obj, picklistOptions: f.picklistOptions || [],isLookup,
            isText, isNumber, isBoolean, isDate, isDatetime,
            isTextarea, isPicklist, isMultiPicklist,
            colCss, value, boolVal, multiVal, inputType, formatter
        };
    }


    // ── Field change handlers ───────────────────────────────────
    onFieldChange(e)   { this._store(e.target.dataset.obj, e.target.dataset.fld, e.target.value); }
    onCheckbox(e)      { this._store(e.target.dataset.obj, e.target.dataset.fld, e.target.checked); }
    onMultiPicklist(e) { this._store(e.target.dataset.obj, e.target.dataset.fld, (e.detail.value || []).join(';')); }
    
    onLookupChange(e) {
    this._store(
        e.target.dataset.obj,
        e.target.dataset.fld,
        e.detail.recordId
    );
}
    _store(obj, fld, val) {
        if (!obj || !fld) return;
        if (!this._formData[obj]) this._formData[obj] = {};
        this._formData[obj][fld] = val;
        this._isDirty = true;
        this._tick++;
    }

    // ── Employee Demographics change ────────────────────────────
    onEmpDemoChange(e) {
          this._isDirty = true;
        const idx  = parseInt(e.currentTarget.dataset.id, 10);
        const name = e.target.name;
        const raw  = e.target.value;
        const val  = (raw === '' || raw == null || isNaN(parseInt(raw, 10))) ? 0 : parseInt(raw, 10);
        this.empDemoRows = this.empDemoRows.map((row, i) => {
            if (i !== idx) return { ...row };
            const r = { ...row };
            if      (name === 'nativeAmerican')  r.Native_American__c        = val;
            else if (name === 'pacificIslander') r.Asian_Pacific_Islander__c = val;
            else if (name === 'caucasian')       r.Caucasian__c              = val;
            else if (name === 'africanAmerican') r.African_American__c       = val;
            else if (name === 'latinx')          r.Latinx__c                 = val;
            else if (name === 'other')           r.Other__c                  = val;
            return r;
        });
    }

    _isSiteVisitFilled() {
    const siteData = this._formData['Site_Visit__c'];

    if (!siteData) return false;

    return Object.values(siteData).some(v =>
        v !== null &&
        v !== '' &&
        !(Array.isArray(v) && v.length === 0)
    );
}

onGuarantorChange(e) {
    const idx     = parseInt(e.currentTarget.dataset.id, 10);
    const field   = e.target.dataset.fld;
    const rowType = e.currentTarget.dataset.type;
    const val     = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

    this._isDirty = true;
    if (rowType === 'borrower') {
        this.borrowerRows = this.borrowerRows.map((row, i) =>
            i === idx ? { ...row, [field]: val } : { ...row }
        );
    } else {
        this.guarantorRows = this.guarantorRows.map((row, i) =>
            i === idx ? { ...row, [field]: val } : { ...row }
        );
    }
}



    // ── Navigation ──────────────────────────────────────────────
 onBack() {
    if (this.isFirstPage) return;

    this._saveAndNavigate(() => {
        this.currentPage--;
        this._openAllForPage(this.currentPage);
    });
}

onNext() {
    this._saveAndNavigate(() => {
        this.currentPage++;
        this._openAllForPage(this.currentPage);
    });
}


_savePage() {
    const payload = {};
   
for (const [obj, fields] of Object.entries(this._formData)) {

    if (!fields || Object.keys(fields).length === 0) continue;

    // ✅ SPECIAL HANDLING FOR SITE VISIT
    if (obj === 'Site_Visit__c') {

        const hasId = !!this._recordIds[obj];

        // Check if any field actually has a meaningful value
        const hasData = Object.values(fields).some(v =>
            v !== null &&
            v !== '' &&
            !(Array.isArray(v) && v.length === 0)
        );

        // ❌ Skip insert if no existing record AND no data entered
        if (!hasId && !hasData) {
            continue;
        }
    }

    payload[obj] = { ...fields };

    if (this._recordIds[obj]) {
        payload[obj].Id = this._recordIds[obj];
    }
}


    const empPayload = this.empDemoRows.map(r => ({
        Id: r.Id,
        Native_American__c: r.Native_American__c,
        Asian_Pacific_Islander__c: r.Asian_Pacific_Islander__c,
        Caucasian__c: r.Caucasian__c,
        African_American__c: r.African_American__c,
        Latinx__c: r.Latinx__c,
        Other__c: r.Other__c
    }));

  const guarantorPayload = [...this.borrowerRows, ...this.guarantorRows].map(r => ({
    Id:                r.Id,
    Ownership__c:      r.Ownership__c,
    Title__c:          r.Title__c,
    Guarantor_Type__c: r.Guarantor_Type__c,
    Primary_Owner__c:  r.Primary_Owner__c
}));

return saveAllData({
    dataJson:      JSON.stringify(payload),
    empDemoJson:   JSON.stringify(empPayload),
    guarantorJson: JSON.stringify(guarantorPayload)
})
    .then(newIds => {
        // Store any newly created record Ids (e.g. new Site_Visit__c)
        // so subsequent saves do UPDATE not INSERT
        if (newIds) {
            for (const [obj, id] of Object.entries(newIds)) {
                if (id) this._recordIds[obj] = id;
            }
        }
    });
}
   
onStepClick(e) {

    const targetPage = parseInt(e.currentTarget.dataset.page, 10);

    if (targetPage === this.currentPage) return;

    this._saveAndNavigate(() => {
        this.currentPage = targetPage;
        this._openAllForPage(targetPage);
    });
}

 _openAllForPage(pageNum) {
    const p = FLOW_CONFIG.find(c => c.page === pageNum);
    // Set ALL keys for this page — accordion mounts fresh and opens all
    this.activeSections = p ? [...p.sections.map(s => s.key)] : [];
}

    // ── Validation ──────────────────────────────────────────────
 _validate() {

    const isSiteVisitFilled = this._isSiteVisitFilled();

    const inputs = [
        ...this.template.querySelectorAll('lightning-input'),
        ...this.template.querySelectorAll('lightning-textarea'),
        ...this.template.querySelectorAll('lightning-combobox'),
        ...this.template.querySelectorAll('lightning-dual-listbox')
    ];

    let ok = true;

    inputs.forEach(el => {

        const obj = el.dataset?.obj;

        // ✅ Skip Site Visit validation if user didn't touch it
        if (obj === 'Site_Visit__c' && !isSiteVisitFilled) {
            el.setCustomValidity('');
            el.reportValidity(); // clears red border
            return;
        }

        if (!el.reportValidity()) {
            ok = false;
        }
    });

    if (!ok) {
        this._toast('Validation Error', 'Please fix the highlighted fields.', 'error');
    }

    return ok;
}



_saveAndNavigate(navigateFn) {

    // ✅ Skip save if nothing changed
    if (!this._isDirty) {
        navigateFn();
        this._scrollTop();
        return;
    }

    this.isSaving = true;

    this._savePage()
        .then(() => {
            this.isSaving = false;

            this._isDirty = false; // ✅ reset after save

            navigateFn();

            this._tick++;
            this._scrollTop();
        })
        .catch(err => {
            this.isSaving = false;
            this._toast('Save Failed', this._msg(err), 'error');
        });
}



    // ── Submit ──────────────────────────────────────────────────
    onSubmit() {
      
        this.isSaving = true;

         this._savePage()
        .then(() => {
            this.isSaving = false;
            this._toast('Submitted', 'Underwriting review saved successfully.', 'success');
            this.dispatchEvent(new CloseActionScreenEvent());
        })
        .catch(err => {
            this.isSaving = false;
            this._toast('Save Failed', this._msg(err), 'error');
        });


        const payload = {};
        for (const [obj, fields] of Object.entries(this._formData)) {
            if (!fields || Object.keys(fields).length === 0) continue;
            payload[obj] = { ...fields };
            if (this._recordIds[obj]) payload[obj].Id = this._recordIds[obj];
        }

        const empPayload = this.empDemoRows.map(r => ({
            Id: r.Id,
            Native_American__c: r.Native_American__c,
            Asian_Pacific_Islander__c: r.Asian_Pacific_Islander__c,
            Caucasian__c: r.Caucasian__c,
            African_American__c: r.African_American__c,
            Latinx__c: r.Latinx__c,
            Other__c: r.Other__c
        }));

        saveAllData({ dataJson: JSON.stringify(payload), empDemoJson: JSON.stringify(empPayload) })
            .then(() => {
                this.isSaving = false;
                this._toast('Submitted', 'Underwriting review saved successfully.', 'success');
                this.dispatchEvent(new CloseActionScreenEvent());
            })
            .catch(err => {
                this.isSaving = false;
                this._toast('Save Failed', this._msg(err), 'error');
            });
    }



    // ── Utilities ────────────────────────────────────────────────
    _scrollTop() {
        const el = this.template.querySelector('.uw-body');
        if (el) el.scrollTop = 0;
    }
    _toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message: message || '', variant }));
    }
    _msg(err) {
        return err?.body?.message || err?.body?.pageErrors?.[0]?.message || err?.message || 'An unexpected error occurred.';
    }
}