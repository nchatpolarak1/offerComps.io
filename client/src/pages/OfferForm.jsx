// the two-step add-offer flow: compensation, then perks

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

// the perk rows every offer starts with, as sketched in the prototype
const PRESET_PERKS = [
    { name: '401k match', category: 'retirement', inputType: 'money' },
    { name: 'PTO type', category: 'PTO', inputType: 'choice', choices: ['unlimited', 'accrued', 'fixed days'] },
    { name: 'Benefits', category: 'lifestyle', inputType: 'money' },
    { name: 'Relocation', category: 'other', inputType: 'money' },
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

function OfferForm() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [cities, setCities] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
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

    useEffect(function () {
        async function loadCities() {
            try {
                const data = await apiClient.get('/cities');
                setCities(data.cities);
            } catch (error) {
                setErrorMessage(error.message);
            }
        }

        loadCities();
    }, []);

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

    // the server checks all of this again, this is just faster feedback
    function validateStep1() {
        if (fields.companyName.trim() === '') {
            setErrorMessage('Company name is required.');
            return false;
        }
        if (fields.jobTitle.trim() === '') {
            setErrorMessage('Job title is required.');
            return false;
        }
        if (fields.cityId === '') {
            setErrorMessage('Please choose a city.');
            return false;
        }

        const baseSalary = Number(fields.baseSalary);
        if (fields.baseSalary === '' || isNaN(baseSalary) || baseSalary <= 0) {
            setErrorMessage('Base salary must be greater than zero.');
            return false;
        }

        if (fields.signingBonus !== '') {
            const signingBonus = Number(fields.signingBonus);
            if (isNaN(signingBonus) || signingBonus < 0) {
                setErrorMessage('Signing bonus must be zero or more.');
                return false;
            }
        }

        if (fields.annualBonusPct !== '') {
            const annualBonusPct = Number(fields.annualBonusPct);
            if (isNaN(annualBonusPct) || annualBonusPct < 0 || annualBonusPct > 100) {
                setErrorMessage('Annual bonus must be between 0 and 100 percent.');
                return false;
            }
        }

        if (fields.equityType === 'RSU') {
            const equityTotalValue = Number(fields.equityTotalValue);
            if (fields.equityTotalValue === '' || isNaN(equityTotalValue) || equityTotalValue < 0) {
                setErrorMessage('Enter the total value of the equity grant.');
                return false;
            }

            const equityVestYears = Number(fields.equityVestYears);
            if (fields.equityVestYears === '' || isNaN(equityVestYears)) {
                setErrorMessage('Enter how many years the equity vests over.');
                return false;
            }
            if (equityVestYears < 1 || equityVestYears > 10) {
                setErrorMessage('Equity must vest over 1 to 10 years.');
                return false;
            }

            if (fields.equityCliffMonths !== '') {
                const cliff = Number(fields.equityCliffMonths);
                if (isNaN(cliff) || cliff < 0 || cliff > 60) {
                    setErrorMessage('The equity cliff must be between 0 and 60 months.');
                    return false;
                }
            }
        }

        if (fields.expectedHoursWeek !== '') {
            const hours = Number(fields.expectedHoursWeek);
            if (isNaN(hours) || hours < 1 || hours > 100) {
                setErrorMessage('Expected hours per week must be between 1 and 100.');
                return false;
            }
        }

        return true;
    }

    function validateStep2() {
        for (let i = 0; i < customPerks.length; i++) {
            const perk = customPerks[i];

            if (perk.name.trim() === '') {
                setErrorMessage('Every custom perk needs a name.');
                return false;
            }
            if (perk.annualValue !== '') {
                const value = Number(perk.annualValue);
                if (isNaN(value) || value < 0) {
                    setErrorMessage('The value of "' + perk.name.trim() + '" must be zero or more.');
                    return false;
                }
            }
        }

        return true;
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
        setErrorMessage('');

        if (!validateStep1()) {
            return;
        }
        setStep(2);
    }

    function onBack() {
        setErrorMessage('');
        setStep(1);
    }

    async function save(event) {
        event.preventDefault();
        setErrorMessage('');

        if (!validateStep2()) {
            return;
        }

        setSaving(true);
        try {
            await apiClient.post('/offers', buildBody());
            navigate('/offers');
        } catch (error) {
            setErrorMessage(error.message);
            setSaving(false);
        }
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

                    {errorMessage !== '' && <p className="error">{errorMessage}</p>}

                    {step === 1 && (
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

                    {step === 2 && (
                        <form onSubmit={save}>
                            {PRESET_PERKS.map(function (preset, index) {
                                return (
                                    <label className="perk-row" key={preset.name}>
                                        <span className="perk-name">{preset.name}</span>
                                        {preset.inputType === 'money' ? (
                                            <input
                                                type="number"
                                                placeholder="Value per year"
                                                value={presetValues[index]}
                                                onChange={function (event) {
                                                    updatePresetValue(index, event.target.value);
                                                }}
                                            />
                                        ) : (
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
                                    {saving ? 'Saving...' : 'Add Offer'}
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
