// the two-step offer flow: compensation, then perks. the same form adds a new
// offer and edits a saved one

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';

// the perk rows every offer starts with, as sketched in the prototype
const PRESET_PERKS = [
    { name: '401k match', category: 'retirement', inputType: 'percentOfBase', placeholder: 'Percent of base' },
    { name: 'PTO type', category: 'PTO', inputType: 'choice', choices: ['unlimited', 'accrued', 'fixed days'] },
    { name: 'Benefits', category: 'lifestyle', inputType: 'text', placeholder: 'PPO medical, dental, vision' },
    { name: 'Relocation', category: 'other', inputType: 'money', placeholder: 'Amount in dollars' },
    { name: 'VISA sponsorship', category: 'other', inputType: 'choice', choices: ['yes', 'no'] }
];

const PERK_CATEGORIES = ['retirement', 'PTO', 'lifestyle', 'other'];

function blankPresetValues() {
    const values = [];

    for (let i = 0; i < PRESET_PERKS.length; i++) {
        values.push('');
    }
    return values;
}

// the API sends numbers and nulls, the inputs want strings
function toFieldValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value);
}

function findPresetIndex(perkName) {
    for (let i = 0; i < PRESET_PERKS.length; i++) {
        if (PRESET_PERKS[i].name === perkName) {
            return i;
        }
    }
    return -1;
}

// a saved perk goes back into the row it was entered in, and anything that is
// not one of the preset rows goes back into the custom list
function perksToRows(perks, baseSalary) {
    const presetValues = blankPresetValues();
    const customPerks = [];

    for (let i = 0; i < perks.length; i++) {
        const perk = perks[i];
        const index = findPresetIndex(perk.name);

        if (index === -1) {
            customPerks.push({
                name: perk.name,
                category: perk.category,
                annualValue: toFieldValue(perk.annualValue),
                detail: toFieldValue(perk.detail)
            });
        } else if (PRESET_PERKS[index].inputType === 'money') {
            presetValues[index] = toFieldValue(perk.annualValue);
        } else if (PRESET_PERKS[index].inputType === 'percentOfBase') {
            if (perk.detail) {
                presetValues[index] = toFieldValue(perk.detail);
            } else if (perk.annualValue && baseSalary > 0) {
                // saved before this row asked for a percent, so work the
                // percent back out of the dollar amount
                const percent = (perk.annualValue / baseSalary) * 100;
                presetValues[index] = String(Math.round(percent * 100) / 100);
            }
        } else {
            presetValues[index] = toFieldValue(perk.detail);
        }
    }

    return { presetValues: presetValues, customPerks: customPerks };
}

// every field has to be filled in, because saving replaces the whole offer and
// anything left out would be wiped
function offerToFields(offer) {
    let deadlineDate = '';
    if (offer.deadlineDate) {
        deadlineDate = offer.deadlineDate.slice(0, 10);
    }

    return {
        companyName: offer.companyName,
        jobTitle: offer.jobTitle,
        jobLevel: toFieldValue(offer.jobLevel),
        cityId: toFieldValue(offer.cityId),
        baseSalary: toFieldValue(offer.baseSalary),
        signingBonus: toFieldValue(offer.signingBonus),
        annualBonusPct: toFieldValue(offer.annualBonusPct),
        equityType: offer.equityType,
        equityTotalValue: toFieldValue(offer.equityTotalValue),
        equityVestYears: toFieldValue(offer.equityVestYears),
        equityCliffMonths: toFieldValue(offer.equityCliffMonths),
        expectedHoursWeek: toFieldValue(offer.expectedHoursWeek),
        workArrangement: offer.workArrangement,
        offerStatus: offer.offerStatus,
        deadlineDate: deadlineDate
    };
}

function OfferForm() {
    const navigate = useNavigate();
    const params = useParams();
    const offerId = params.offerId;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [cities, setCities] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [fields, setFields] = useState({
        companyName: '',
        jobTitle: '',
        jobLevel: '',
        cityId: '',
        baseSalary: '',
        signingBonus: '',
        annualBonusPct: '',
        equityType: 'none',
        equityTotalValue: '',
        equityVestYears: '',
        equityCliffMonths: '',
        expectedHoursWeek: '40',
        workArrangement: 'onsite',
        offerStatus: 'pending',
        deadlineDate: ''
    });
    const [presetValues, setPresetValues] = useState(blankPresetValues());
    const [customPerks, setCustomPerks] = useState([]);

    useEffect(
        function () {
            async function load() {
                try {
                    const data = await apiClient.get('/cities');
                    setCities(data.cities);

                    if (offerId) {
                        const saved = await apiClient.get('/offers/' + offerId);
                        const rows = perksToRows(saved.offer.perks, saved.offer.baseSalary);

                        setFields(offerToFields(saved.offer));
                        setPresetValues(rows.presetValues);
                        setCustomPerks(rows.customPerks);
                    }
                } catch (error) {
                    setFormError(error.message);
                }

                setLoading(false);
            }

            load();
        },
        [offerId]
    );

    function updateField(name, value) {
        const updated = Object.assign({}, fields);
        updated[name] = value;
        setFields(updated);
    }

    function updatePresetValue(index, value) {
        const updated = presetValues.slice();
        updated[index] = value;
        setPresetValues(updated);
    }

    function updateCustomPerk(index, name, value) {
        const updated = customPerks.slice();
        updated[index] = Object.assign({}, updated[index]);
        updated[index][name] = value;
        setCustomPerks(updated);
    }

    function onAddCustomPerk() {
        const updated = customPerks.slice();
        updated.push({ name: '', category: 'other', annualValue: '', detail: '' });
        setCustomPerks(updated);
    }

    function onRemoveCustomPerk(index) {
        const remaining = [];

        for (let i = 0; i < customPerks.length; i++) {
            if (i !== index) {
                remaining.push(customPerks[i]);
            }
        }
        setCustomPerks(remaining);
    }

    // mirrors what the server checks, just quicker to show it here first
    function validateStep1() {
        const errors = {};

        if (fields.companyName.trim() === '') {
            errors.companyName = 'Company name is required.';
        }
        if (fields.jobTitle.trim() === '') {
            errors.jobTitle = 'Job title is required.';
        }
        if (fields.cityId === '') {
            errors.cityId = 'Please choose a city.';
        }

        const baseSalary = Number(fields.baseSalary);
        if (fields.baseSalary === '' || isNaN(baseSalary) || baseSalary <= 0) {
            errors.baseSalary = 'Base salary must be greater than zero.';
        }

        if (fields.signingBonus !== '') {
            const signingBonus = Number(fields.signingBonus);
            if (isNaN(signingBonus) || signingBonus < 0) {
                errors.signingBonus = 'Signing bonus must be zero or more.';
            }
        }

        if (fields.annualBonusPct !== '') {
            const annualBonusPct = Number(fields.annualBonusPct);
            if (isNaN(annualBonusPct) || annualBonusPct < 0 || annualBonusPct > 100) {
                errors.annualBonusPct = 'Annual bonus must be between 0 and 100 percent.';
            }
        }

        if (fields.equityType === 'RSU') {
            const equityTotalValue = Number(fields.equityTotalValue);
            if (fields.equityTotalValue === '' || isNaN(equityTotalValue) || equityTotalValue < 0) {
                errors.equityTotalValue = 'Enter the total value of the equity grant.';
            }

            const equityVestYears = Number(fields.equityVestYears);
            if (fields.equityVestYears === '' || isNaN(equityVestYears)) {
                errors.equityVestYears = 'Enter how many years the equity vests over.';
            } else if (equityVestYears < 1 || equityVestYears > 10) {
                errors.equityVestYears = 'Equity must vest over 1 to 10 years.';
            }

            if (fields.equityCliffMonths !== '') {
                const cliff = Number(fields.equityCliffMonths);
                if (isNaN(cliff) || cliff < 0 || cliff > 60) {
                    errors.equityCliffMonths =
                        'The equity cliff must be between 0 and 60 months.';
                }
            }
        }

        if (fields.expectedHoursWeek !== '') {
            const hours = Number(fields.expectedHoursWeek);
            if (isNaN(hours) || hours < 1 || hours > 100) {
                errors.expectedHoursWeek = 'Expected hours per week must be between 1 and 100.';
            }
        }

        return errors;
    }

    function validateStep2() {
        const errors = {};

        for (let i = 0; i < PRESET_PERKS.length; i++) {
            const preset = PRESET_PERKS[i];
            const value = presetValues[i].trim();

            if (preset.inputType === 'percentOfBase' && value !== '') {
                const percent = Number(value);
                if (isNaN(percent) || percent < 0 || percent > 100) {
                    errors['preset' + i] = 'Enter a percentage between 0 and 100.';
                }
            }
        }

        for (let i = 0; i < customPerks.length; i++) {
            const perk = customPerks[i];

            if (perk.name.trim() === '') {
                errors['perkName' + i] = 'Every custom perk needs a name.';
            }
            if (perk.annualValue !== '') {
                const value = Number(perk.annualValue);
                if (isNaN(value) || value < 0) {
                    errors['perkValue' + i] = 'The value must be zero or more.';
                }
            }
        }

        return errors;
    }

    // rows the user left blank are not saved at all
    function collectPerks() {
        const perks = [];

        for (let i = 0; i < PRESET_PERKS.length; i++) {
            const preset = PRESET_PERKS[i];
            const value = presetValues[i].trim();

            if (value !== '') {
                if (preset.inputType === 'money') {
                    perks.push({
                        name: preset.name,
                        category: preset.category,
                        annualValue: value,
                        detail: ''
                    });
                } else if (preset.inputType === 'percentOfBase') {
                    // the percent is what gets typed, but scoring adds up dollars,
                    // so both are saved
                    const base = Number(fields.baseSalary);
                    const dollars = Math.round((base * Number(value)) / 100);

                    perks.push({
                        name: preset.name,
                        category: preset.category,
                        annualValue: String(dollars),
                        detail: value
                    });
                } else {
                    perks.push({
                        name: preset.name,
                        category: preset.category,
                        detail: value
                    });
                }
            }
        }

        for (let i = 0; i < customPerks.length; i++) {
            const perk = customPerks[i];
            const saved = {
                name: perk.name.trim(),
                category: perk.category,
                detail: perk.detail.trim()
            };

            if (perk.annualValue.trim() !== '') {
                saved.annualValue = perk.annualValue.trim();
            }
            perks.push(saved);
        }

        return perks;
    }

    function buildBody() {
        const body = {
            companyName: fields.companyName.trim(),
            jobTitle: fields.jobTitle.trim(),
            cityId: fields.cityId,
            baseSalary: fields.baseSalary,
            equityType: fields.equityType,
            workArrangement: fields.workArrangement,
            offerStatus: fields.offerStatus,
            perks: collectPerks()
        };

        // blank optional fields are left out so the server's defaults apply
        if (fields.jobLevel.trim() !== '') {
            body.jobLevel = fields.jobLevel.trim();
        }
        if (fields.signingBonus !== '') {
            body.signingBonus = fields.signingBonus;
        }
        if (fields.annualBonusPct !== '') {
            body.annualBonusPct = fields.annualBonusPct;
        }
        if (fields.expectedHoursWeek !== '') {
            body.expectedHoursWeek = fields.expectedHoursWeek;
        }
        if (fields.deadlineDate !== '') {
            body.deadlineDate = fields.deadlineDate;
        }

        if (fields.equityType === 'RSU') {
            body.equityTotalValue = fields.equityTotalValue;
            body.equityVestYears = fields.equityVestYears;
            if (fields.equityCliffMonths !== '') {
                body.equityCliffMonths = fields.equityCliffMonths;
            }
        }

        return body;
    }

    function onNext(event) {
        event.preventDefault();
        setFormError('');

        const errors = validateStep1();
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }
        setStep(2);
    }

    function onBack() {
        setFormError('');
        setFieldErrors({});
        setStep(1);
    }

    async function save(event) {
        event.preventDefault();
        setFormError('');

        const errors = validateStep2();
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setSaving(true);
        try {
            if (offerId) {
                await apiClient.put('/offers/' + offerId, buildBody());
            } else {
                await apiClient.post('/offers', buildBody());
            }
            navigate('/offers');
        } catch (error) {
            setFormError(error.message);
            setSaving(false);
        }
    }

    let saveLabel = 'Add Offer';
    if (offerId) {
        saveLabel = 'Save changes';
    }
    if (saving) {
        saveLabel = 'Saving...';
    }

    return (
        <div className="app-page">
            <header className="app-header">
                <span className="app-title">Job Offer Comparison Tool</span>
                <nav className="app-nav">
                    <Link to="/offers">Home</Link>
                </nav>
            </header>

            <main className="app-main form-page">
                <section className="panel">
                    <div className="panel-header">
                        <h2>{step === 1 ? 'Compensation' : 'Company Perks'}</h2>
                        <span className="step-hint">Step {step} of 2</span>
                    </div>

                    {formError !== '' && <p className="error">{formError}</p>}

                    {loading && <p className="empty">Loading...</p>}

                    {!loading && step === 1 && (
                        <form onSubmit={onNext}>
                            <label className="field">
                                <span className="field-label">Company</span>
                                <input
                                    type="text"
                                    value={fields.companyName}
                                    onChange={function (event) {
                                        updateField('companyName', event.target.value);
                                    }}
                                />
                                {fieldErrors.companyName && (
                                    <span className="field-error">{fieldErrors.companyName}</span>
                                )}
                            </label>

                            <div className="field-row">
                                <label className="field">
                                    <span className="field-label">Job title</span>
                                    <input
                                        type="text"
                                        value={fields.jobTitle}
                                        onChange={function (event) {
                                            updateField('jobTitle', event.target.value);
                                        }}
                                    />
                                    {fieldErrors.jobTitle && (
                                        <span className="field-error">{fieldErrors.jobTitle}</span>
                                    )}
                                </label>

                                <label className="field">
                                    <span className="field-label">Job level (optional)</span>
                                    <input
                                        type="text"
                                        value={fields.jobLevel}
                                        onChange={function (event) {
                                            updateField('jobLevel', event.target.value);
                                        }}
                                    />
                                </label>
                            </div>

                            <label className="field">
                                <span className="field-label">City</span>
                                <select
                                    value={fields.cityId}
                                    disabled={cities.length === 0}
                                    onChange={function (event) {
                                        updateField('cityId', event.target.value);
                                    }}
                                >
                                    <option value="">
                                        {cities.length === 0 ? 'Loading cities...' : 'Choose a city'}
                                    </option>
                                    {cities.map(function (city) {
                                        return (
                                            <option key={city.cityId} value={city.cityId}>
                                                {city.cityName + ', ' + city.stateCode}
                                            </option>
                                        );
                                    })}
                                </select>
                                {fieldErrors.cityId && (
                                    <span className="field-error">{fieldErrors.cityId}</span>
                                )}
                            </label>

                            <div className="field-row">
                                <label className="field">
                                    <span className="field-label">Base salary</span>
                                    <input
                                        type="number"
                                        value={fields.baseSalary}
                                        onChange={function (event) {
                                            updateField('baseSalary', event.target.value);
                                        }}
                                    />
                                    {fieldErrors.baseSalary && (
                                        <span className="field-error">{fieldErrors.baseSalary}</span>
                                    )}
                                </label>

                                <label className="field">
                                    <span className="field-label">Signing bonus</span>
                                    <input
                                        type="number"
                                        value={fields.signingBonus}
                                        onChange={function (event) {
                                            updateField('signingBonus', event.target.value);
                                        }}
                                    />
                                    {fieldErrors.signingBonus && (
                                        <span className="field-error">{fieldErrors.signingBonus}</span>
                                    )}
                                </label>
                            </div>

                            <div className="field-row">
                                <label className="field">
                                    <span className="field-label">Annual bonus (%)</span>
                                    <input
                                        type="number"
                                        value={fields.annualBonusPct}
                                        onChange={function (event) {
                                            updateField('annualBonusPct', event.target.value);
                                        }}
                                    />
                                    {fieldErrors.annualBonusPct && (
                                        <span className="field-error">{fieldErrors.annualBonusPct}</span>
                                    )}
                                </label>

                                <label className="field">
                                    <span className="field-label">Equity</span>
                                    <select
                                        value={fields.equityType}
                                        onChange={function (event) {
                                            updateField('equityType', event.target.value);
                                        }}
                                    >
                                        <option value="none">No equity</option>
                                        <option value="RSU">RSU</option>
                                    </select>
                                </label>
                            </div>

                            {fields.equityType === 'RSU' && (
                                <div className="field-row">
                                    <label className="field">
                                        <span className="field-label">Grant value</span>
                                        <input
                                            type="number"
                                            value={fields.equityTotalValue}
                                            onChange={function (event) {
                                                updateField('equityTotalValue', event.target.value);
                                            }}
                                        />
                                        {fieldErrors.equityTotalValue && (
                                            <span className="field-error">{fieldErrors.equityTotalValue}</span>
                                        )}
                                    </label>

                                    <label className="field">
                                        <span className="field-label">Vests over (years)</span>
                                        <input
                                            type="number"
                                            value={fields.equityVestYears}
                                            onChange={function (event) {
                                                updateField('equityVestYears', event.target.value);
                                            }}
                                        />
                                        {fieldErrors.equityVestYears && (
                                            <span className="field-error">{fieldErrors.equityVestYears}</span>
                                        )}
                                    </label>

                                    <label className="field">
                                        <span className="field-label">Cliff (months)</span>
                                        <input
                                            type="number"
                                            value={fields.equityCliffMonths}
                                            onChange={function (event) {
                                                updateField('equityCliffMonths', event.target.value);
                                            }}
                                        />
                                        {fieldErrors.equityCliffMonths && (
                                            <span className="field-error">{fieldErrors.equityCliffMonths}</span>
                                        )}
                                    </label>
                                </div>
                            )}

                            <div className="field-row">
                                <label className="field">
                                    <span className="field-label">Expected hours per week</span>
                                    <input
                                        type="number"
                                        value={fields.expectedHoursWeek}
                                        onChange={function (event) {
                                            updateField('expectedHoursWeek', event.target.value);
                                        }}
                                    />
                                    {fieldErrors.expectedHoursWeek && (
                                        <span className="field-error">{fieldErrors.expectedHoursWeek}</span>
                                    )}
                                </label>

                                <label className="field">
                                    <span className="field-label">Work arrangement</span>
                                    <select
                                        value={fields.workArrangement}
                                        onChange={function (event) {
                                            updateField('workArrangement', event.target.value);
                                        }}
                                    >
                                        <option value="onsite">Onsite</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="remote">Remote</option>
                                    </select>
                                </label>
                            </div>

                            <div className="field-row">
                                <label className="field">
                                    <span className="field-label">Status</span>
                                    <select
                                        value={fields.offerStatus}
                                        onChange={function (event) {
                                            updateField('offerStatus', event.target.value);
                                        }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="declined">Declined</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </label>

                                <label className="field">
                                    <span className="field-label">Decision deadline (optional)</span>
                                    <input
                                        type="date"
                                        value={fields.deadlineDate}
                                        onChange={function (event) {
                                            updateField('deadlineDate', event.target.value);
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="form-actions">
                                <Link to="/offers" className="button secondary">
                                    Cancel
                                </Link>
                                <button type="submit" className="button primary">
                                    Next
                                </button>
                            </div>
                        </form>
                    )}

                    {!loading && step === 2 && (
                        <form onSubmit={save}>
                            {PRESET_PERKS.map(function (preset, index) {
                                return (
                                    <label className="perk-row" key={preset.name}>
                                        <span className="perk-name">{preset.name}</span>

                                        {preset.inputType === 'choice' && (
                                            <select
                                                value={presetValues[index]}
                                                onChange={function (event) {
                                                    updatePresetValue(index, event.target.value);
                                                }}
                                            >
                                                <option value="">Not offered</option>
                                                {preset.choices.map(function (choice) {
                                                    return (
                                                        <option key={choice} value={choice}>
                                                            {choice}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        )}

                                        {preset.inputType === 'text' && (
                                            <input
                                                type="text"
                                                placeholder={preset.placeholder}
                                                value={presetValues[index]}
                                                onChange={function (event) {
                                                    updatePresetValue(index, event.target.value);
                                                }}
                                            />
                                        )}

                                        {preset.inputType === 'money' && (
                                            <input
                                                type="number"
                                                placeholder={preset.placeholder}
                                                value={presetValues[index]}
                                                onChange={function (event) {
                                                    updatePresetValue(index, event.target.value);
                                                }}
                                            />
                                        )}

                                        {preset.inputType === 'percentOfBase' && (
                                            <span className="perk-percent">
                                                <input
                                                    type="number"
                                                    placeholder={preset.placeholder}
                                                    value={presetValues[index]}
                                                    onChange={function (event) {
                                                        updatePresetValue(index, event.target.value);
                                                    }}
                                                />
                                                <span className="perk-suffix">% of base</span>
                                                {fieldErrors['preset' + index] && (
                                                    <span className="field-error">
                                                        {fieldErrors['preset' + index]}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}

                            {customPerks.map(function (perk, index) {
                                return (
                                    <div className="custom-perk" key={index}>
                                        <div className="field-row">
                                            <label className="field">
                                                <span className="field-label">Perk name</span>
                                                <input
                                                    type="text"
                                                    value={perk.name}
                                                    onChange={function (event) {
                                                        updateCustomPerk(index, 'name', event.target.value);
                                                    }}
                                                />
                                                {fieldErrors['perkName' + index] && (
                                                    <span className="field-error">
                                                        {fieldErrors['perkName' + index]}
                                                    </span>
                                                )}
                                            </label>

                                            <label className="field">
                                                <span className="field-label">Category</span>
                                                <select
                                                    value={perk.category}
                                                    onChange={function (event) {
                                                        updateCustomPerk(index, 'category', event.target.value);
                                                    }}
                                                >
                                                    {PERK_CATEGORIES.map(function (category) {
                                                        return (
                                                            <option key={category} value={category}>
                                                                {category}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </label>
                                        </div>

                                        <div className="field-row">
                                            <label className="field">
                                                <span className="field-label">Value per year (optional)</span>
                                                <input
                                                    type="number"
                                                    value={perk.annualValue}
                                                    onChange={function (event) {
                                                        updateCustomPerk(index, 'annualValue', event.target.value);
                                                    }}
                                                />
                                                {fieldErrors['perkValue' + index] && (
                                                    <span className="field-error">
                                                        {fieldErrors['perkValue' + index]}
                                                    </span>
                                                )}
                                            </label>

                                            <label className="field">
                                                <span className="field-label">Details (optional)</span>
                                                <input
                                                    type="text"
                                                    value={perk.detail}
                                                    onChange={function (event) {
                                                        updateCustomPerk(index, 'detail', event.target.value);
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        <button
                                            type="button"
                                            className="button danger"
                                            onClick={function () {
                                                onRemoveCustomPerk(index);
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}

                            <button type="button" className="button secondary" onClick={onAddCustomPerk}>
                                + Add custom perk
                            </button>

                            <div className="form-actions">
                                <button type="button" className="button secondary" onClick={onBack}>
                                    Back
                                </button>
                                <button type="submit" className="button primary" disabled={saving}>
                                    {saveLabel}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
}

export default OfferForm;
