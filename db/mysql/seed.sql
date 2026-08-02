
INSERT INTO state (state_code, state_name, income_tax_type) VALUES
    ('US', 'Federal',        'progressive'),
    ('AZ', 'Arizona',        'flat'),
    ('CA', 'California',     'progressive'),
    ('CO', 'Colorado',       'flat'),
    ('GA', 'Georgia',        'flat'),
    ('IL', 'Illinois',       'flat'),
    ('MA', 'Massachusetts',  'flat'),
    ('NC', 'North Carolina', 'flat'),
    ('NY', 'New York',       'progressive'),
    ('OR', 'Oregon',         'progressive'),
    ('PA', 'Pennsylvania',   'flat'),
    ('TX', 'Texas',          'none'),
    ('WA', 'Washington',     'none');

-- ---------------------------------------------------------------------
-- city
-- fixed list of 12 metros a user can pick from when adding an offer.
-- ---------------------------------------------------------------------
INSERT INTO city (city_name, state_code, col_index, mean_commute_minutes, median_rent_1br) VALUES
    ('San Francisco', 'CA', 169.6, 32.5, 2950.00),
    ('New York',      'NY', 154.2, 39.1, 4100.00),
    ('Boston',        'MA', 148.4, 31.2, 2800.00),
    ('Seattle',       'WA', 138.9, 28.6, 1950.00),
    ('Los Angeles',   'CA', 136.4, 31.8, 2300.00),
    ('Denver',        'CO', 106.8, 26.4, 1600.00),
    ('Portland',      'OR', 106.3, 26.9, 1500.00),
    ('Chicago',       'IL', 105.9, 33.4, 1850.00),
    ('Austin',        'TX', 101.3, 25.7, 1450.00),
    ('Atlanta',       'GA',  99.4, 30.2, 1650.00),
    ('Phoenix',       'AZ',  98.7, 26.1, 1350.00),
    ('Raleigh',       'NC',  95.9, 24.8, 1350.00),
    ('Pittsburgh',    'PA',  92.5, 25.3, 1400.00);

-- ---------------------------------------------------------------------
-- tax_bracket - federal, single filer, tax year 2025
-- ---------------------------------------------------------------------
INSERT INTO tax_bracket (jurisdiction_code, tax_year, lower_bound, upper_bound, rate) VALUES
    ('US', 2025,      0.00,  11925.00, 0.10000),
    ('US', 2025,  11925.00,  48475.00, 0.12000),
    ('US', 2025,  48475.00, 103350.00, 0.22000),
    ('US', 2025, 103350.00, 197300.00, 0.24000),
    ('US', 2025, 197300.00, 250525.00, 0.32000),
    ('US', 2025, 250525.00, 626350.00, 0.35000),
    ('US', 2025, 626350.00,      NULL, 0.37000);

-- ---------------------------------------------------------------------
-- tax_bracket - progressive states, single filer, tax year 2025
-- ---------------------------------------------------------------------

-- California
INSERT INTO tax_bracket (jurisdiction_code, tax_year, lower_bound, upper_bound, rate) VALUES
    ('CA', 2025,      0.00,  10756.00, 0.01000),
    ('CA', 2025,  10756.00,  25499.00, 0.02000),
    ('CA', 2025,  25499.00,  40245.00, 0.04000),
    ('CA', 2025,  40245.00,  55866.00, 0.06000),
    ('CA', 2025,  55866.00,  70606.00, 0.08000),
    ('CA', 2025,  70606.00, 360659.00, 0.09300),
    ('CA', 2025, 360659.00, 432787.00, 0.10300),
    ('CA', 2025, 432787.00, 721314.00, 0.11300),
    ('CA', 2025, 721314.00,      NULL, 0.12300);

-- New York
INSERT INTO tax_bracket (jurisdiction_code, tax_year, lower_bound, upper_bound, rate) VALUES
    ('NY', 2025,        0.00,     8500.00, 0.04000),
    ('NY', 2025,     8500.00,    11700.00, 0.04500),
    ('NY', 2025,    11700.00,    13900.00, 0.05250),
    ('NY', 2025,    13900.00,    80650.00, 0.05500),
    ('NY', 2025,    80650.00,   215400.00, 0.06000),
    ('NY', 2025,   215400.00,  1077550.00, 0.06850),
    ('NY', 2025,  1077550.00,  5000000.00, 0.09650),
    ('NY', 2025,  5000000.00, 25000000.00, 0.10300),
    ('NY', 2025, 25000000.00,        NULL, 0.10900);

-- Oregon
INSERT INTO tax_bracket (jurisdiction_code, tax_year, lower_bound, upper_bound, rate) VALUES
    ('OR', 2025,      0.00,   4400.00, 0.04750),
    ('OR', 2025,   4400.00,  11050.00, 0.06750),
    ('OR', 2025,  11050.00, 125000.00, 0.08750),
    ('OR', 2025, 125000.00,      NULL, 0.09900);

-- ---------------------------------------------------------------------
-- tax_bracket - flat states, tax year 2025
-- ---------------------------------------------------------------------
INSERT INTO tax_bracket (jurisdiction_code, tax_year, lower_bound, upper_bound, rate) VALUES
    ('AZ', 2025, 0.00, NULL, 0.02500),
    ('CO', 2025, 0.00, NULL, 0.04400),
    ('GA', 2025, 0.00, NULL, 0.05190),
    ('IL', 2025, 0.00, NULL, 0.04950),
    ('MA', 2025, 0.00, NULL, 0.05000),
    ('NC', 2025, 0.00, NULL, 0.04250),
    ('PA', 2025, 0.00, NULL, 0.03070);

-- Texas and Washington have no state income tax on wages, so they get no
-- bracket rows at all. a state with no rows gets treated as a zero rate.
