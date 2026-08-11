/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.7.2-MariaDB, for osx10.20 (arm64)
--
-- Host: 127.0.0.1    Database: job_offers
-- ------------------------------------------------------
-- Server version	11.7.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Current Database: `job_offers`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `job_offers` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `job_offers`;

--
-- Table structure for table `app_user`
--

DROP TABLE IF EXISTS `app_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_app_user_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_user`
--

LOCK TABLES `app_user` WRITE;
/*!40000 ALTER TABLE `app_user` DISABLE KEYS */;
INSERT INTO `app_user` VALUES
(2,'demo@example.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','Nathan','Chatpolarak','2026-08-04 23:51:15','2026-08-09 22:48:58');
/*!40000 ALTER TABLE `app_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `city`
--

DROP TABLE IF EXISTS `city`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `city` (
  `city_id` int(11) NOT NULL AUTO_INCREMENT,
  `city_name` varchar(100) NOT NULL,
  `state_code` char(2) NOT NULL,
  `col_index` decimal(5,1) NOT NULL,
  `mean_commute_minutes` decimal(4,1) NOT NULL,
  `median_rent_1br` decimal(8,2) DEFAULT NULL,
  PRIMARY KEY (`city_id`),
  UNIQUE KEY `uq_city_name_state` (`city_name`,`state_code`),
  KEY `fk_city_state` (`state_code`),
  CONSTRAINT `fk_city_state` FOREIGN KEY (`state_code`) REFERENCES `state` (`state_code`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `city`
--

LOCK TABLES `city` WRITE;
/*!40000 ALTER TABLE `city` DISABLE KEYS */;
INSERT INTO `city` VALUES
(1,'San Francisco','CA',169.6,32.5,2950.00),
(2,'New York','NY',154.2,39.1,4100.00),
(3,'Boston','MA',148.4,31.2,2800.00),
(4,'Seattle','WA',138.9,28.6,1950.00),
(5,'Los Angeles','CA',136.4,31.8,2300.00),
(6,'Denver','CO',106.8,26.4,1600.00),
(7,'Portland','OR',106.3,26.9,1500.00),
(8,'Chicago','IL',105.9,33.4,1850.00),
(9,'Austin','TX',101.3,25.7,1450.00),
(10,'Atlanta','GA',99.4,30.2,1650.00),
(11,'Phoenix','AZ',98.7,26.1,1350.00),
(12,'Raleigh','NC',95.9,24.8,1350.00),
(13,'Pittsburgh','PA',92.5,25.3,1400.00);
/*!40000 ALTER TABLE `city` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company`
--

DROP TABLE IF EXISTS `company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `company` (
  `company_id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(150) NOT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `website_url` varchar(255) DEFAULT NULL,
  `hq_city_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`company_id`),
  UNIQUE KEY `uq_company_name` (`company_name`),
  KEY `fk_company_hq_city` (`hq_city_id`),
  CONSTRAINT `fk_company_hq_city` FOREIGN KEY (`hq_city_id`) REFERENCES `city` (`city_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company`
--

LOCK TABLES `company` WRITE;
/*!40000 ALTER TABLE `company` DISABLE KEYS */;
INSERT INTO `company` VALUES
(1,'Google',NULL,NULL,NULL),
(2,'Meta',NULL,NULL,NULL),
(3,'Citadel',NULL,NULL,NULL),
(6,'Apple',NULL,NULL,NULL),
(8,'asdfadfs',NULL,NULL,NULL),
(9,'microsoft',NULL,NULL,NULL);
/*!40000 ALTER TABLE `company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comparison`
--

DROP TABLE IF EXISTS `comparison`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `comparison` (
  `comparison_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `comparison_name` varchar(100) NOT NULL,
  `w_pay` decimal(3,2) NOT NULL DEFAULT 0.55,
  `w_commute` decimal(3,2) NOT NULL DEFAULT 0.15,
  `w_hours` decimal(3,2) NOT NULL DEFAULT 0.20,
  `w_flexibility` decimal(3,2) NOT NULL DEFAULT 0.10,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comparison_id`),
  KEY `idx_comparison_user` (`user_id`),
  CONSTRAINT `fk_comparison_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_weights_sum` CHECK (`w_pay` + `w_commute` + `w_hours` + `w_flexibility` = 1.00)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comparison`
--

LOCK TABLES `comparison` WRITE;
/*!40000 ALTER TABLE `comparison` DISABLE KEYS */;
INSERT INTO `comparison` VALUES
(4,2,'battle of the faangs',0.00,0.37,0.42,0.21,'2026-08-07 20:09:06'),
(7,2,'goog v meta',0.34,0.15,0.45,0.06,'2026-08-08 01:24:56'),
(8,2,'asfasdf',0.50,0.20,0.20,0.10,'2026-08-09 20:33:18'),
(9,2,'all of it',0.50,0.20,0.20,0.10,'2026-08-09 22:53:30');
/*!40000 ALTER TABLE `comparison` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comparison_offer`
--

DROP TABLE IF EXISTS `comparison_offer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `comparison_offer` (
  `comparison_id` int(11) NOT NULL,
  `offer_id` int(11) NOT NULL,
  `display_order` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`comparison_id`,`offer_id`),
  KEY `idx_cmp_offer_offer` (`offer_id`),
  CONSTRAINT `fk_cmp_offer_comparison` FOREIGN KEY (`comparison_id`) REFERENCES `comparison` (`comparison_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cmp_offer_offer` FOREIGN KEY (`offer_id`) REFERENCES `offer` (`offer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comparison_offer`
--

LOCK TABLES `comparison_offer` WRITE;
/*!40000 ALTER TABLE `comparison_offer` DISABLE KEYS */;
INSERT INTO `comparison_offer` VALUES
(4,7,2),
(4,8,1),
(7,7,2),
(7,9,1),
(8,6,4),
(8,7,3),
(8,8,2),
(8,9,1),
(9,6,4),
(9,7,3),
(9,8,2),
(9,9,1);
/*!40000 ALTER TABLE `comparison_offer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offer`
--

DROP TABLE IF EXISTS `offer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer` (
  `offer_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `city_id` int(11) NOT NULL,
  `job_title` varchar(150) NOT NULL,
  `job_level` varchar(50) DEFAULT NULL,
  `base_salary` decimal(12,2) NOT NULL,
  `signing_bonus` decimal(12,2) NOT NULL DEFAULT 0.00,
  `annual_bonus_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `equity_type` enum('none','RSU') NOT NULL DEFAULT 'none',
  `equity_total_value` decimal(12,2) DEFAULT NULL,
  `equity_vest_years` tinyint(4) DEFAULT NULL,
  `equity_cliff_months` tinyint(4) DEFAULT 12,
  `expected_hours_week` tinyint(4) NOT NULL DEFAULT 40,
  `work_arrangement` enum('onsite','hybrid','remote') NOT NULL DEFAULT 'onsite',
  `offer_status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
  `deadline_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`offer_id`),
  KEY `idx_offer_user` (`user_id`),
  KEY `idx_offer_company` (`company_id`),
  KEY `idx_offer_city` (`city_id`),
  CONSTRAINT `fk_offer_city` FOREIGN KEY (`city_id`) REFERENCES `city` (`city_id`),
  CONSTRAINT `fk_offer_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`company_id`),
  CONSTRAINT `fk_offer_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_offer_salary` CHECK (`base_salary` > 0),
  CONSTRAINT `chk_offer_hours` CHECK (`expected_hours_week` between 1 and 100)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offer`
--

LOCK TABLES `offer` WRITE;
/*!40000 ALTER TABLE `offer` DISABLE KEYS */;
INSERT INTO `offer` VALUES
(6,2,3,2,'Software Engineer',NULL,250000.00,120000.00,0.00,'none',NULL,NULL,NULL,50,'onsite','pending',NULL,'2026-08-07 18:42:16','2026-08-07 18:42:16'),
(7,2,2,1,'Software Engineer',NULL,144000.00,6000.00,0.00,'RSU',40000.00,4,12,40,'onsite','pending',NULL,'2026-08-07 18:44:14','2026-08-07 18:44:14'),
(8,2,6,9,'Software Engineer',NULL,128000.00,10000.00,0.00,'RSU',22000.00,4,12,40,'onsite','pending',NULL,'2026-08-07 20:08:42','2026-08-07 20:08:42'),
(9,2,1,1,'Software Engineer',NULL,160000.00,7000.00,0.00,'RSU',34000.00,4,12,60,'onsite','pending',NULL,'2026-08-07 21:53:59','2026-08-09 16:34:50');
/*!40000 ALTER TABLE `offer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `state`
--

DROP TABLE IF EXISTS `state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `state` (
  `state_code` char(2) NOT NULL,
  `state_name` varchar(50) NOT NULL,
  `income_tax_type` enum('none','flat','progressive') NOT NULL,
  PRIMARY KEY (`state_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `state`
--

LOCK TABLES `state` WRITE;
/*!40000 ALTER TABLE `state` DISABLE KEYS */;
INSERT INTO `state` VALUES
('AZ','Arizona','flat'),
('CA','California','progressive'),
('CO','Colorado','flat'),
('GA','Georgia','flat'),
('IL','Illinois','flat'),
('MA','Massachusetts','flat'),
('NC','North Carolina','flat'),
('NY','New York','progressive'),
('OR','Oregon','progressive'),
('PA','Pennsylvania','flat'),
('TX','Texas','none'),
('US','Federal','progressive'),
('WA','Washington','none');
/*!40000 ALTER TABLE `state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_bracket`
--

DROP TABLE IF EXISTS `tax_bracket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_bracket` (
  `bracket_id` int(11) NOT NULL AUTO_INCREMENT,
  `jurisdiction_code` char(2) NOT NULL,
  `tax_year` smallint(6) NOT NULL,
  `lower_bound` decimal(12,2) NOT NULL,
  `upper_bound` decimal(12,2) DEFAULT NULL,
  `rate` decimal(6,5) NOT NULL,
  PRIMARY KEY (`bracket_id`),
  UNIQUE KEY `uq_bracket` (`jurisdiction_code`,`tax_year`,`lower_bound`),
  CONSTRAINT `fk_bracket_state` FOREIGN KEY (`jurisdiction_code`) REFERENCES `state` (`state_code`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_bracket`
--

LOCK TABLES `tax_bracket` WRITE;
/*!40000 ALTER TABLE `tax_bracket` DISABLE KEYS */;
INSERT INTO `tax_bracket` VALUES
(1,'US',2025,0.00,11925.00,0.10000),
(2,'US',2025,11925.00,48475.00,0.12000),
(3,'US',2025,48475.00,103350.00,0.22000),
(4,'US',2025,103350.00,197300.00,0.24000),
(5,'US',2025,197300.00,250525.00,0.32000),
(6,'US',2025,250525.00,626350.00,0.35000),
(7,'US',2025,626350.00,NULL,0.37000),
(8,'CA',2025,0.00,10756.00,0.01000),
(9,'CA',2025,10756.00,25499.00,0.02000),
(10,'CA',2025,25499.00,40245.00,0.04000),
(11,'CA',2025,40245.00,55866.00,0.06000),
(12,'CA',2025,55866.00,70606.00,0.08000),
(13,'CA',2025,70606.00,360659.00,0.09300),
(14,'CA',2025,360659.00,432787.00,0.10300),
(15,'CA',2025,432787.00,721314.00,0.11300),
(16,'CA',2025,721314.00,NULL,0.12300),
(17,'NY',2025,0.00,8500.00,0.04000),
(18,'NY',2025,8500.00,11700.00,0.04500),
(19,'NY',2025,11700.00,13900.00,0.05250),
(20,'NY',2025,13900.00,80650.00,0.05500),
(21,'NY',2025,80650.00,215400.00,0.06000),
(22,'NY',2025,215400.00,1077550.00,0.06850),
(23,'NY',2025,1077550.00,5000000.00,0.09650),
(24,'NY',2025,5000000.00,25000000.00,0.10300),
(25,'NY',2025,25000000.00,NULL,0.10900),
(26,'OR',2025,0.00,4400.00,0.04750),
(27,'OR',2025,4400.00,11050.00,0.06750),
(28,'OR',2025,11050.00,125000.00,0.08750),
(29,'OR',2025,125000.00,NULL,0.09900),
(30,'AZ',2025,0.00,NULL,0.02500),
(31,'CO',2025,0.00,NULL,0.04400),
(32,'GA',2025,0.00,NULL,0.05190),
(33,'IL',2025,0.00,NULL,0.04950),
(34,'MA',2025,0.00,NULL,0.05000),
(35,'NC',2025,0.00,NULL,0.04250),
(36,'PA',2025,0.00,NULL,0.03070);
/*!40000 ALTER TABLE `tax_bracket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vesting_tranche`
--

DROP TABLE IF EXISTS `vesting_tranche`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vesting_tranche` (
  `offer_id` int(11) NOT NULL,
  `year_number` tinyint(4) NOT NULL,
  `vest_pct` decimal(5,2) NOT NULL,
  PRIMARY KEY (`offer_id`,`year_number`),
  CONSTRAINT `fk_tranche_offer` FOREIGN KEY (`offer_id`) REFERENCES `offer` (`offer_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_tranche_pct` CHECK (`vest_pct` >= 0 and `vest_pct` <= 100),
  CONSTRAINT `chk_tranche_year` CHECK (`year_number` between 1 and 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vesting_tranche`
--

LOCK TABLES `vesting_tranche` WRITE;
/*!40000 ALTER TABLE `vesting_tranche` DISABLE KEYS */;
/*!40000 ALTER TABLE `vesting_tranche` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-08-10 20:10:48
