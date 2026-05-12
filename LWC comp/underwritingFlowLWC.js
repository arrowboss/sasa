/**
 * underwritingFlow.js  —  final production version
 *
 * Opens as a Salesforce modal dialog via ScreenAction Quick Action.
 * @api recordId is injected automatically by Salesforce.
 *
 * ── CONFIGURING FIELD SETS ─────────────────────────────────────────────────
 * Edit FLOW_CONFIG below. For each section set:
 *   objectApiName  ← Salesforce object API name
 *   fieldSetName   ← Field Set API name  (Setup → Object Manager → Field Sets)
 *                    Set to '' or 'REPLACE_FIELDSET' to render a placeholder
 *   lookupField    ← null            if object IS Loan__c (self)
 *                    'Client__c'      if Loan HAS lookup TO Client__c
 *                    'Loan__c'        if object HAS lookup TO Loan (reverse)
 *   reverseLookup  ← true  when child object has lookup back to Loan
 *   reverseLatest  ← true  when only the LATEST child record should be used
 *   isEmpDemo      ← true  only for the Employee Demographics custom table section
 * ──────────────────────────────────────────────────────────────────────────
 */

import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent }                     from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent }             from 'lightning/actions';
import { CurrentPageReference }               from 'lightning/navigation';
import getFlowData  from '@salesforce/apex/UWFlowController.getFlowData';
import saveAllData  from '@salesforce/apex/UWFlowController.saveAllData';

/* ════════════════════════════════════════════════════════════════════
   FLOW CONFIG  —  the only place you configure sections and field sets
   ════════════════════════════════════════════════════════════════════ */
const FLOW_CONFIG = [

    /* ── PAGE 1 : Analysis ──────────────────────────────────────── */
    {
        page: 1,
        pageLabel: 'Analysis',
        sections: [
            {
                key:           'business_info',
                accordionLabel: 'Business Info',
                objectApiName: 'Client__c',
                fieldSetName:  'Business_Info',       // ← field set on Client__c
                lookupField:   'Client__c',           // lookup field on Loan__c → Client__c
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'employee_demographics',
                accordionLabel: 'Employee Demographics',
                objectApiName: 'Employee_Demographics__c',
                fieldSetName:  '',                    // custom table — no field set needed
                lookupField:   'Loan__c',
                reverseLookup: true,
                reverseLatest: false,
                isEmpDemo:     true                   // renders the race/ethnicity table
            },
            {
                key:           'principal_1',
                accordionLabel: 'Principal 1',
                objectApiName: 'Business_Owner__c',
                fieldSetName:  'Principal_1',       // ← REPLACE with your field set name
                lookupField:   'Business_Owner__c',   // lookup field on Loan__c → Business_Owner__c
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'eligibility_check',
                accordionLabel: 'Eligibility Check',
                objectApiName: 'Loan__c',
                fieldSetName:  'REPLACE_FIELDSET',    // ← REPLACE when ready
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'borrower_ownership',
                accordionLabel: 'Borrower Ownership',
                objectApiName: 'Loan__c',
                fieldSetName:  'REPLACE_FIELDSET',    // ← REPLACE when ready
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'guarantors',
                accordionLabel: 'Guarantors',
                objectApiName: 'Loan__c',
                fieldSetName:  'REPLACE_FIELDSET',    // ← REPLACE when ready
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'sba_required_info',
                accordionLabel: 'SBA Required Info',
                objectApiName: 'Loan__c',
                fieldSetName:  'REPLACE_FIELDSET',    // ← REPLACE when ready
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'others_p1',
                accordionLabel: 'Others',
                objectApiName: 'Loan__c',
                fieldSetName:  'REPLACE_FIELDSET',    // ← REPLACE when ready
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'additional_fields_p1',
                accordionLabel: 'Additional Fields',
                objectApiName: 'Loan__c',
                fieldSetName:  'REPLACE_FIELDSET',    // ← REPLACE when ready (or leave to hide)
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            }
        ]
    },

    /* ── PAGE 2 : Site Visit / Credit Analysis ──────────────────── */
    {
        page: 2,
        pageLabel: 'Site Visit',
        sections: [
            {
                key:           'business_background',
                accordionLabel: 'Business Background',
                objectApiName: 'Credit_Memo__c',
                fieldSetName:  'Business_Background', // ← REPLACE with your field set name
                lookupField:   'Loan__c',             // field on Credit_Memo__c pointing to Loan
                reverseLookup: true,
                reverseLatest: true,
                isEmpDemo:     false
            },
             {
                key:           'lease',
                accordionLabel: 'Lease',
                objectApiName: 'Credit_Memo__c',
                fieldSetName:  'Lease', // ← REPLACE with your field set name
                lookupField:   'Loan__c',             // field on Credit_Memo__c pointing to Loan
                reverseLookup: true,
                reverseLatest: true,
                isEmpDemo:     false
            },
            {
                key:           'cash_flow_analysis',
                accordionLabel: 'Cash Flow Analysis',
                objectApiName: 'Credit_Memo__c',
                fieldSetName:  'Cash_Flow_Analysis',  // ← REPLACE with your field set name
                lookupField:   'Loan__c',
                reverseLookup: true,
                reverseLatest: true,
                isEmpDemo:     false
            },
                {
                key:           'debt_service_coverage',
                accordionLabel: 'Debt Service Coverage',
                objectApiName: 'Credit_Memo__c',
                fieldSetName:  'Debt_Service_Coverage', // ← REPLACE with your field set name
                lookupField:   'Loan__c',             // field on Credit_Memo__c pointing to Loan
                reverseLookup: true,
                reverseLatest: true,
                isEmpDemo:     false
            },
            {
                key:           'site_visit',
                accordionLabel: 'Site Visit',
                objectApiName: 'Site_Visit__c',
                fieldSetName:  'Site_Visit',          // ← REPLACE with your field set name
                lookupField:   'Loan__c',             // field on Site_Visit__c pointing to Loan
                reverseLookup: true,
                reverseLatest: true,
                isEmpDemo:     false
            },
            {
                key:           'additional_fields_p2',
                accordionLabel: 'Additional Fields',
                objectApiName: 'Loan__c',
                fieldSetName:  'REPLACE_FIELDSET',    // ← REPLACE when ready (or leave to hide)
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            }
        ]
    },

    /* ── PAGE 3 : Credit Memo ───────────────────────────────────── */
    {
        page: 3,
        pageLabel: 'Credit Memo',
        sections: [
            {
                key:           'credit_analysis_details',
                accordionLabel: 'Credit Analysis Details',
                objectApiName: 'Loan__c',
                fieldSetName:  'Credit_Analysis_Details', // ← REPLACE with your field set name
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'funding_source_1',
                accordionLabel: 'Funding Source 1',
                objectApiName: 'Loan__c',
                fieldSetName:  'Funding_Source_1',    // ← REPLACE with your field set name
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'funding_source_2',
                accordionLabel: 'Funding Source 2',
                objectApiName: 'Loan__c',
                fieldSetName:  'Funding_Source_2',    // ← REPLACE with your field set name
                lookupField:   null,
                reverseLookup: false,
                reverseLatest: false,
                isEmpDemo:     false
            },
            {
                key:           'additional_fields_p3',
                accordionLabel: 'Additional Fields',
                objectApiName: 'Credit_Memo__c',
                fieldSetName:  'REPLACE_FIELDSET',    // ← REPLACE when ready (or leave to hide)
                lookupField:   'Loan__c',
                reverseLookup: true,
                reverseLatest: true,
                isEmpDemo:     false
            }
        ]
    }
];
/* ════════════════════════════════════════════════════════════════════
   END FLOW_CONFIG
   ════════════════════════════════════════════════════════════════════ */

const TEXT_TYPES     = new Set(['STRING','EMAIL','PHONE','URL','ID','REFERENCE']);
const NUMBER_TYPES   = new Set(['DOUBLE','CURRENCY','PERCENT','INTEGER','LONG']);
const TEXTAREA_TYPES = new Set(['TEXTAREA','ENCRYPTEDSTRING']);
const PLACEHOLDER    = 'REPLACE_FIELDSET';

export default class UnderwritingFlow extends LightningElement {

    // recordId is read from CurrentPageReference — the only reliable way
    // to get it in a Quick Action ScreenAction modal on first open.
    @api recordId;   // kept as fallback (populated by platform on record pages)
 _loaded = false;

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

    @track currentPage    = 1;
    @track isLoading      = true;
    @track isSaving       = false;
    @track hasError       = false;
    @track errorMessage   = '';
    @track activeSections = [];
    @track empDemoRows    = [];   // live-edited demographics rows
    @track _tick          = 0;   // bump to force getter re-evaluation

    _sections      = [];   // SectionResult[] from Apex
    _formData      = {};   // { ObjectApiName: { fieldApi: value } }
    _recordIds     = {};   // { ObjectApiName: recordId }
    _hasSiteVisit  = false;
    _hasCreditMemo = false;

    // ── Load — one Apex call, all data ─────────────────────────
    _load() {
        this.isLoading = true;
        this.hasError  = false;

        // Send only non-empDemo, non-placeholder sections to Apex
        const configPayload = FLOW_CONFIG.flatMap(p =>
            p.sections
                .filter(s => !s.isEmpDemo && s.fieldSetName !== PLACEHOLDER && s.fieldSetName !== '')
                .map(s => ({
                    key:           s.key,
                    fieldSetName:  s.fieldSetName,
                    objectApiName: s.objectApiName,
                    lookupField:   s.lookupField   || null,
                    reverseLookup: s.reverseLookup || false,
                    reverseLatest: s.reverseLatest || false
                }))
        );

        getFlowData({ loanId: this.recordId, configJson: JSON.stringify(configPayload) })
            .then(data => {
                this._recordIds     = { ...(data.recordIds    || {}) };
                this._hasSiteVisit  = data.hasSiteVisit  || false;
                this._hasCreditMemo = data.hasCreditMemo || false;
                this._sections      = data.sections      || [];

                // Seed _formData with existing record values so fields pre-populate
                const seeded = {};
                for (const [obj, vals] of Object.entries(data.recordValues || {})) {
                    seeded[obj] = { ...vals };
                }
                this._formData = seeded;

                // Employee Demographics — store as plain objects for editing
                // Apex returns field names as-is in the Map keys (Race_And_Ethinicity__c etc.)
                this.empDemoRows = (data.employeeDemoRows || []).map(r => ({ ...r }));

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

    onRetry() {
        this._load();
    }

    // ── Computed getters ────────────────────────────────────────
    get isReady()          { return !this.isLoading && !this.hasError; }
    get isFirstPage()      { return this.currentPage === 1; }
    get isLastPage()       { return this.currentPage === FLOW_CONFIG.length; }
    get currentStepValue() { return String(this.currentPage); }
    get hasEmpDemoRows()   { return this.empDemoRows && this.empDemoRows.length > 0; }

    // Sections to render on the current page
    get currentSections() {
        void this._tick; // reactive dependency
        const pageConf = FLOW_CONFIG.find(p => p.page === this.currentPage);
        if (!pageConf) return [];

        return pageConf.sections.map(s => {
            // Employee Demographics — custom table, no field set
            if (s.isEmpDemo) {
                return {
                    key: s.key,
                    accordionLabel: s.accordionLabel,
                    isEmpDemo:  true,
                    isEmpty:    false,
                    isFieldSet: false,
                    fields:     []
                };
            }

            // Not yet configured — show placeholder message
            if (!s.fieldSetName || s.fieldSetName === PLACEHOLDER) {
                return {
                    key: s.key,
                    accordionLabel: s.accordionLabel,
                    isEmpDemo:  false,
                    isEmpty:    true,
                    isFieldSet: false,
                    emptyMsg:   'Field set not yet configured for this section.',
                    fields:     []
                };
            }

            // Reverse-latest objects: show empty if no record exists for this loan
            if (s.reverseLatest) {
                const hasRecord = s.objectApiName === 'Site_Visit__c'
                    ? this._hasSiteVisit : this._hasCreditMemo;
                if (!hasRecord) {
                    return {
                        key: s.key,
                        accordionLabel: s.accordionLabel,
                        isEmpDemo:  false,
                        isEmpty:    true,
                        isFieldSet: false,
                        emptyMsg:   'No records found for this loan.',
                        fields:     []
                    };
                }
            }

            // Normal field-set section — enrich fields with live form values
            const meta   = this._sections.find(m => m.sectionKey === s.key);
            const fields = (meta && meta.fields)
                ? meta.fields.map(f => this._enrich(f))
                : [];

            return {
                key: s.key,
                accordionLabel: s.accordionLabel,
                isEmpDemo:  false,
                isEmpty:    fields.length === 0,
                isFieldSet: fields.length > 0,
                emptyMsg:   'No fields returned from this field set.',
                fields
            };
        });
    }

    // Enrich one FieldInfo with current in-memory value and type flags
    _enrich(f) {
        const ft  = f.fieldType || 'STRING';
        const obj = f.objectApiName;
        // Read from _formData first (user edits), fall back to server value (recordValues)
        const stored = (this._formData[obj] || {})[f.apiName];
        const val    = stored !== undefined
            ? stored
            : ((this._formData[obj] || {})[f.apiName] ?? null);

        const isText          = TEXT_TYPES.has(ft);
        const isNumber        = NUMBER_TYPES.has(ft);
        const isBoolean       = ft === 'BOOLEAN';
        const isDate          = ft === 'DATE';
        const isDatetime      = ft === 'DATETIME';
        const isTextarea      = TEXTAREA_TYPES.has(ft);
        const isPicklist      = ft === 'PICKLIST';
        const isMultiPicklist = ft === 'MULTIPICKLIST';

        const multiVal = isMultiPicklist
            ? (val ? String(val).split(';').map(v => v.trim()).filter(Boolean) : [])
            : [];
        const boolVal  = isBoolean ? (val === true || val === 'true') : false;
        const value    = (isBoolean || isMultiPicklist) ? '' : (val == null ? '' : String(val));

        const colCss   = (isTextarea || isMultiPicklist)
            ? 'slds-col slds-size_1-of-1'
            : 'slds-col slds-size_1-of-1 slds-medium-size_1-of-2';

        const inputType = ft === 'EMAIL' ? 'email'
                        : ft === 'PHONE' ? 'tel'
                        : ft === 'URL'   ? 'url'
                        : 'text';
        const formatter = ft === 'CURRENCY' ? 'currency'
                        : ft === 'PERCENT'  ? 'percent-fixed'
                        : 'decimal';

        return {
            uid:            `${obj}__${f.apiName}`,
            apiName:        f.apiName,
            label:          f.label,
            required:       f.required,
            isDisabled:     f.updateable === false,
            objectApiName:  obj,
            picklistOptions: f.picklistOptions || [],
            isText, isNumber, isBoolean, isDate, isDatetime,
            isTextarea, isPicklist, isMultiPicklist,
            colCss, value, boolVal, multiVal, inputType, formatter
        };
    }

    // ── Field change handlers ───────────────────────────────────
    onFieldChange(e) {
        this._store(e.target.dataset.obj, e.target.dataset.fld, e.target.value);
    }
    onCheckbox(e) {
        this._store(e.target.dataset.obj, e.target.dataset.fld, e.target.checked);
    }
    onMultiPicklist(e) {
        this._store(e.target.dataset.obj, e.target.dataset.fld, (e.detail.value || []).join(';'));
    }
    _store(obj, fld, val) {
        if (!obj || !fld) return;
        if (!this._formData[obj]) this._formData[obj] = {};
        this._formData[obj][fld] = val;
        this._tick++; // trigger re-render so getter picks up new value
    }

    // ── Employee Demographics change ────────────────────────────
    // Apex returns plain field API names as Map keys (Race_And_Ethinicity__c etc.)
    // HTML uses name="nativeAmerican" etc. — map back to field API names here
    onEmpDemoChange(e) {
        const idx  = parseInt(e.currentTarget.dataset.id, 10);
        const name = e.target.name;
        const raw  = e.target.value;
        const val  = (raw === '' || raw == null || isNaN(parseInt(raw, 10)))
            ? 0 : parseInt(raw, 10);

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

    // ── Navigation ──────────────────────────────────────────────
    onBack() {
        if (this.isFirstPage) return;
        this.currentPage--;
        this._openAllForPage(this.currentPage);
        this._tick++;
        this._scrollTop();
    }
    onNext() {
        if (!this._validate()) return;
        this.currentPage++;
        this._openAllForPage(this.currentPage);
        this._tick++;
        this._scrollTop();
    }
    onStepClick(e) {
        const t = parseInt(e.currentTarget.dataset.page, 10);
        if (t < this.currentPage) {
            this.currentPage = t;
            this._openAllForPage(t);
            this._tick++;
            this._scrollTop();
        }
    }
    _openAllForPage(pageNum) {
        const p = FLOW_CONFIG.find(c => c.page === pageNum);
        this.activeSections = p ? p.sections.map(s => s.key) : [];
    }

    // ── Validation ──────────────────────────────────────────────
    _validate() {
        const inputs = [
            ...this.template.querySelectorAll('lightning-input'),
            ...this.template.querySelectorAll('lightning-textarea'),
            ...this.template.querySelectorAll('lightning-combobox'),
            ...this.template.querySelectorAll('lightning-dual-listbox')
        ];
        let ok = true;
        inputs.forEach(el => { if (!el.reportValidity()) ok = false; });
        if (!ok) this._toast('Validation Error', 'Please fix the highlighted fields.', 'error');
        return ok;
    }

    // ── Submit — called once on page 3 ──────────────────────────
    onSubmit() {
        if (!this._validate()) return;
        this.isSaving = true;

        // Build object payload — attach existing record Id so Apex does UPDATE
        const payload = {};
        for (const [obj, fields] of Object.entries(this._formData)) {
            if (!fields || Object.keys(fields).length === 0) continue;
            payload[obj] = { ...fields };
            // Attach the fetched record Id so Apex knows which record to update
            if (this._recordIds[obj]) {
                payload[obj].Id = this._recordIds[obj];
            }
            // If no Id for this object, Apex will skip it (UPDATE only policy)
        }

        // Employee Demographics payload — use field API names (as Apex returned them)
        const empPayload = this.empDemoRows.map(r => ({
            Id:                        r.Id,
            Native_American__c:        r.Native_American__c,
            Asian_Pacific_Islander__c: r.Asian_Pacific_Islander__c,
            Caucasian__c:              r.Caucasian__c,
            African_American__c:       r.African_American__c,
            Latinx__c:                 r.Latinx__c,
            Other__c:                  r.Other__c
        }));

        saveAllData({
            dataJson:    JSON.stringify(payload),
            empDemoJson: JSON.stringify(empPayload)
        })
            .then(() => {
                this.isSaving = false;
                this._toast('Submitted', 'Underwriting review saved successfully.', 'success');
                // Close the modal dialog immediately after the toast fires
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
        return err?.body?.message
            || err?.body?.pageErrors?.[0]?.message
            || err?.message
            || 'An unexpected error occurred.';
    }
}