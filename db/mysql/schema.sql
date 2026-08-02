
CREATE TABLE app_user (
    user_id       INT             NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    first_name    VARCHAR(50)     NOT NULL,
    last_name     VARCHAR(50)     NOT NULL,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP       NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_app_user_email (email)
);


CREATE TABLE state (
    state_code      CHAR(2)     NOT NULL,
    state_name      VARCHAR(50) NOT NULL,
    income_tax_type ENUM('none','flat','progressive') NOT NULL,
    PRIMARY KEY (state_code)
);


CREATE TABLE city (
    city_id              INT           NOT NULL AUTO_INCREMENT,
    city_name            VARCHAR(100)  NOT NULL,
    state_code           CHAR(2)       NOT NULL,
    col_index            DECIMAL(5,1)  NOT NULL,  -- national average = 100.0
    mean_commute_minutes DECIMAL(4,1)  NOT NULL,
    median_rent_1br      DECIMAL(8,2)  NULL,
    PRIMARY KEY (city_id),
    UNIQUE KEY uq_city_name_state (city_name, state_code),
    CONSTRAINT fk_city_state
        FOREIGN KEY (state_code) REFERENCES state (state_code)
);


CREATE TABLE tax_bracket (
    bracket_id        INT           NOT NULL AUTO_INCREMENT,
    jurisdiction_code CHAR(2)       NOT NULL,  -- 'US' = federal, else state
    tax_year          SMALLINT      NOT NULL,
    lower_bound       DECIMAL(12,2) NOT NULL,
    upper_bound       DECIMAL(12,2) NULL,
    rate              DECIMAL(6,5)  NOT NULL,  -- 0.24000 = 24%
    PRIMARY KEY (bracket_id),
    UNIQUE KEY uq_bracket (jurisdiction_code, tax_year, lower_bound),
    CONSTRAINT fk_bracket_state
        FOREIGN KEY (jurisdiction_code) REFERENCES state (state_code)
);


CREATE TABLE company (
    company_id   INT          NOT NULL AUTO_INCREMENT,
    company_name VARCHAR(150) NOT NULL,
    industry     VARCHAR(100) NULL,
    website_url  VARCHAR(255) NULL,
    hq_city_id   INT          NULL,
    PRIMARY KEY (company_id),
    UNIQUE KEY uq_company_name (company_name),
    CONSTRAINT fk_company_hq_city
        FOREIGN KEY (hq_city_id) REFERENCES city (city_id)
);

CREATE TABLE offer (
    offer_id            INT           NOT NULL AUTO_INCREMENT,
    user_id             INT           NOT NULL,
    company_id          INT           NOT NULL,
    city_id             INT           NOT NULL,
    job_title           VARCHAR(150)  NOT NULL,
    job_level           VARCHAR(50)   NULL,
    base_salary         DECIMAL(12,2) NOT NULL,
    signing_bonus       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    annual_bonus_pct    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    equity_type         ENUM('none','RSU') NOT NULL DEFAULT 'none',
    equity_total_value  DECIMAL(12,2) NULL,   -- total grant value at offer date
    equity_vest_years   TINYINT       NULL,
    equity_cliff_months TINYINT       NULL DEFAULT 12,
    expected_hours_week TINYINT       NOT NULL DEFAULT 40,
    work_arrangement    ENUM('onsite','hybrid','remote') NOT NULL DEFAULT 'onsite',
    offer_status        ENUM('pending','accepted','declined','expired')
                                      NOT NULL DEFAULT 'pending',
    deadline_date       DATE          NULL,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (offer_id),
    KEY idx_offer_user (user_id),
    KEY idx_offer_company (company_id),
    KEY idx_offer_city (city_id),
    CONSTRAINT fk_offer_user
        FOREIGN KEY (user_id) REFERENCES app_user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_offer_company
        FOREIGN KEY (company_id) REFERENCES company (company_id),
    CONSTRAINT fk_offer_city
        FOREIGN KEY (city_id) REFERENCES city (city_id),
    CONSTRAINT chk_offer_salary CHECK (base_salary > 0),
    CONSTRAINT chk_offer_hours  CHECK (expected_hours_week BETWEEN 1 AND 100)
);


CREATE TABLE vesting_tranche (
    offer_id    INT          NOT NULL,
    year_number TINYINT      NOT NULL,  -- 1 .. equity_vest_years
    vest_pct    DECIMAL(5,2) NOT NULL,  -- must sum to 100.00 per offer
    PRIMARY KEY (offer_id, year_number),
    CONSTRAINT fk_tranche_offer
        FOREIGN KEY (offer_id) REFERENCES offer (offer_id) ON DELETE CASCADE,
    CONSTRAINT chk_tranche_pct  CHECK (vest_pct >= 0 AND vest_pct <= 100),
    CONSTRAINT chk_tranche_year CHECK (year_number BETWEEN 1 AND 10)
);


CREATE TABLE comparison (
    comparison_id   INT          NOT NULL AUTO_INCREMENT,
    user_id         INT          NOT NULL,
    comparison_name VARCHAR(100) NOT NULL,
    w_pay           DECIMAL(3,2) NOT NULL DEFAULT 0.55,
    w_commute       DECIMAL(3,2) NOT NULL DEFAULT 0.15,
    w_hours         DECIMAL(3,2) NOT NULL DEFAULT 0.20,
    w_flexibility   DECIMAL(3,2) NOT NULL DEFAULT 0.10,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comparison_id),
    KEY idx_comparison_user (user_id),
    CONSTRAINT fk_comparison_user
        FOREIGN KEY (user_id) REFERENCES app_user (user_id) ON DELETE CASCADE,
    CONSTRAINT chk_weights_sum
        CHECK (w_pay + w_commute + w_hours + w_flexibility = 1.00)
);


CREATE TABLE comparison_offer (
    comparison_id INT     NOT NULL,
    offer_id      INT     NOT NULL,
    display_order TINYINT NOT NULL DEFAULT 1,
    PRIMARY KEY (comparison_id, offer_id),
    KEY idx_cmp_offer_offer (offer_id),
    CONSTRAINT fk_cmp_offer_comparison
        FOREIGN KEY (comparison_id) REFERENCES comparison (comparison_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_cmp_offer_offer
        FOREIGN KEY (offer_id) REFERENCES offer (offer_id) ON DELETE CASCADE
);
