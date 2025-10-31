--
-- PostgreSQL database dump
--

\restrict lrGpgAigq4EpU0KQNSbZYPeMeHp5fwc14izC3DI0ijb5H7OjdxvMTJ46qh5HXHC

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'APPROVED',
    'REJECTED',
    'DRAFT'
);


ALTER TYPE public."ApplicationStatus" OWNER TO postgres;

--
-- Name: ConversationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ConversationType" AS ENUM (
    'DONOR_STUDENT',
    'DONOR_ADMIN',
    'STUDENT_ADMIN'
);


ALTER TYPE public."ConversationType" OWNER TO postgres;

--
-- Name: Currency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Currency" AS ENUM (
    'USD',
    'PKR',
    'EUR',
    'GBP',
    'CAD',
    'AUD'
);


ALTER TYPE public."Currency" OWNER TO postgres;

--
-- Name: DisbursementStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DisbursementStatus" AS ENUM (
    'INITIATED',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."DisbursementStatus" OWNER TO postgres;

--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DocumentType" AS ENUM (
    'CNIC',
    'GUARDIAN_CNIC',
    'PHOTO',
    'SSC_RESULT',
    'HSSC_RESULT',
    'UNIVERSITY_CARD',
    'FEE_INVOICE',
    'INCOME_CERTIFICATE',
    'UTILITY_BILL',
    'TRANSCRIPT',
    'DEGREE_CERTIFICATE',
    'ENROLLMENT_CERTIFICATE',
    'OTHER'
);


ALTER TYPE public."DocumentType" OWNER TO postgres;

--
-- Name: ProgressReportStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProgressReportStatus" AS ENUM (
    'SUBMITTED',
    'REVIEWED',
    'APPROVED',
    'NEEDS_REVISION'
);


ALTER TYPE public."ProgressReportStatus" OWNER TO postgres;

--
-- Name: StudentPhase; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StudentPhase" AS ENUM (
    'APPLICATION',
    'ACTIVE',
    'GRADUATED'
);


ALTER TYPE public."StudentPhase" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'STUDENT',
    'DONOR',
    'ADMIN',
    'SUB_ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    text text NOT NULL,
    "fromRole" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "studentId" text NOT NULL,
    "applicationId" text
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id text NOT NULL,
    "studentId" text NOT NULL,
    term text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'PENDING'::public."ApplicationStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "fxRate" double precision,
    currency public."Currency" NOT NULL,
    "amountOriginal" integer,
    "currencyOriginal" public."Currency",
    "amountBaseUSD" integer,
    "baseCurrency" public."Currency" DEFAULT 'USD'::public."Currency",
    "fxRateToUSD" double precision,
    "fxAsOf" timestamp(3) without time zone,
    "tuitionFee" integer,
    "hostelFee" integer,
    "otherExpenses" integer,
    "familyIncome" integer,
    "familyContribution" integer,
    purpose text,
    "approvalReason" text,
    "livingExpenses" integer,
    "scholarshipAmount" integer,
    "totalExpense" integer,
    "universityFee" integer,
    amount integer NOT NULL
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: conversation_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation_messages (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    "senderRole" public."UserRole" NOT NULL,
    text text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readBy" text[]
);


ALTER TABLE public.conversation_messages OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    type public."ConversationType" NOT NULL,
    "participantIds" text[],
    "studentId" text,
    "applicationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: disbursements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disbursements (
    id text NOT NULL,
    "studentId" text NOT NULL,
    amount integer NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."DisbursementStatus" DEFAULT 'INITIATED'::public."DisbursementStatus" NOT NULL,
    notes text,
    "amountOriginal" integer,
    "currencyOriginal" public."Currency",
    "amountBaseUSD" integer,
    "baseCurrency" public."Currency" DEFAULT 'USD'::public."Currency",
    "fxRateToUSD" double precision,
    "fxAsOf" timestamp(3) without time zone
);


ALTER TABLE public.disbursements OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "applicationId" text,
    type public."DocumentType" NOT NULL,
    url text NOT NULL,
    "originalName" text,
    "mimeType" text,
    size integer,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: donors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donors (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    organization text,
    "totalFunded" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    country text,
    address text,
    "currencyPreference" public."Currency",
    "taxId" text,
    phone text
);


ALTER TABLE public.donors OWNER TO postgres;

--
-- Name: field_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.field_reviews (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    "studentId" text NOT NULL,
    "officerUserId" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    notes text,
    recommendation text,
    "homeVisitDate" timestamp(3) without time zone,
    "homeVisitNotes" text,
    "familyInterviewNotes" text,
    "financialVerificationNotes" text,
    "characterAssessment" text,
    "deservingnessFactor" integer,
    "documentsVerified" boolean DEFAULT false NOT NULL,
    "identityVerified" boolean DEFAULT false NOT NULL,
    "familyIncomeVerified" boolean DEFAULT false NOT NULL,
    "educationVerified" boolean DEFAULT false NOT NULL,
    "recommendationReason" text,
    "additionalDocumentsRequested" text[],
    "riskFactors" text[],
    "verificationScore" integer,
    "fielderRecommendation" text,
    "adminNotesRequired" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.field_reviews OWNER TO postgres;

--
-- Name: fx_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fx_rates (
    id text NOT NULL,
    base public."Currency" NOT NULL,
    quote public."Currency" NOT NULL,
    rate double precision NOT NULL,
    "asOf" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    source text
);


ALTER TABLE public.fx_rates OWNER TO postgres;

--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- Name: progress_report_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.progress_report_attachments (
    id text NOT NULL,
    "progressReportId" text NOT NULL,
    filename text NOT NULL,
    filepath text NOT NULL,
    mimetype text NOT NULL,
    size integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.progress_report_attachments OWNER TO postgres;

--
-- Name: progress_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.progress_reports (
    id text NOT NULL,
    "studentId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status public."ProgressReportStatus" DEFAULT 'SUBMITTED'::public."ProgressReportStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedBy" text,
    "reviewNotes" text
);


ALTER TABLE public.progress_reports OWNER TO postgres;

--
-- Name: sponsorships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sponsorships (
    id text NOT NULL,
    "donorId" text NOT NULL,
    "studentId" text NOT NULL,
    amount integer NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "paymentFrequency" text,
    "stripePaymentIntentId" text,
    "stripeSubscriptionId" text,
    "amountOriginal" integer,
    "currencyOriginal" public."Currency",
    "amountBaseUSD" integer,
    "baseCurrency" public."Currency" DEFAULT 'USD'::public."Currency",
    "fxRateToUSD" double precision,
    "fxAsOf" timestamp(3) without time zone
);


ALTER TABLE public.sponsorships OWNER TO postgres;

--
-- Name: student_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_progress (
    id text NOT NULL,
    "studentId" text NOT NULL,
    term text NOT NULL,
    gpa double precision NOT NULL,
    "coursesCompleted" integer,
    "creditsEarned" integer,
    achievements text,
    challenges text,
    goals text,
    notes text,
    "updateType" text DEFAULT 'academic'::text NOT NULL,
    documents jsonb,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.student_progress OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    gender text NOT NULL,
    university text NOT NULL,
    field text NOT NULL,
    program text NOT NULL,
    gpa double precision NOT NULL,
    "gradYear" integer NOT NULL,
    city text,
    country text NOT NULL,
    province text,
    sponsored boolean DEFAULT false NOT NULL,
    "studentPhase" public."StudentPhase" DEFAULT 'APPLICATION'::public."StudentPhase",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    cnic text,
    "dateOfBirth" timestamp(3) without time zone,
    "guardianName" text,
    "guardianCnic" text,
    phone text,
    address text,
    "currentInstitution" text,
    "currentCity" text,
    "currentCompletionYear" integer,
    "personalIntroduction" text,
    "academicAchievements" text,
    "careerGoals" text,
    "communityInvolvement" text,
    "currentAcademicYear" text,
    "familySize" integer,
    "monthlyFamilyIncome" text,
    "parentsOccupation" text,
    "specificField" text
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."UserRole" NOT NULL,
    "studentId" text,
    "donorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, text, "fromRole", "createdAt", "studentId", "applicationId") FROM stdin;
cmh8xqyym000o9eae0io8p1y5	Submitted application for review.	student	2025-10-27 09:28:44.926	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw
cmh8y29n4000t9eaex97jve3o	Hi Jamshaid - I may be coming to your home next week.  Will call your dad to confirm.	sub_admin	2025-10-27 09:37:31.984	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw
cmh8y8chq000v9eaexernow0z	Awake: Additional documents required - Updated Income Certificate. These documents are required to complete your field verification process.	admin	2025-10-27 09:42:15.614	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw
cmh8ycb6i000x9eae4cp28f5g	I will send this soon	student	2025-10-27 09:45:20.538	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw
cmh8ydjif000z9eaerk2xfwhk	Awake: Verification completed by Eshan Ulla. Recommendation: approve. Your application is now under review.	admin	2025-10-27 09:46:17.991	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw
cmh94jl48000j13lp19vv2a0c	Submitted application for review.	student	2025-10-27 12:38:57.704	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2
cmh94l97r000n13lpiubx3f7n	Message from sub admin to student - please respond	sub_admin	2025-10-27 12:40:15.591	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2
cmh94mfbq000p13lpp9sz1h7m	Message from sub admin to student - HERE IS THE RESPONSE	student	2025-10-27 12:41:10.167	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2
cmh94o8vq000r13lpkdiv1e54	Awake: Verification completed by Eshan Ulla. Recommendation: approve. Your application is now under review.	admin	2025-10-27 12:42:35.127	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2
cmh94qsoo000t13lp91sg5s7s	Awake: Verification completed by Eshan Ulla. . Your application is now under review.	admin	2025-10-27 12:44:34.104	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2
cmh94ttly000v13lphyd6af5p	Awake: Verification completed by Eshan Ulla. Recommendation: approve. Your application is now under review.	admin	2025-10-27 12:46:55.27	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2
cmh9g3ujm000j11ivvcgtmool	Submitted application for review.	student	2025-10-27 18:02:38.818	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
62082660-09c0-485e-a2c7-0e1013f91179	85067bd9c5bf7659b74db2c590362a8ba92413387a90d4a855547f633d0194b4	2025-10-17 18:55:43.310557+02	20251017165541_initial_complete_schema	\N	\N	2025-10-17 18:55:43.205068+02	1
bce89c54-899e-4413-a0db-a1527882f09e	244d812a661d750cf4c0debb30eeee9a1fb6363f15bd29d05cb881ee5e4874ba	2025-10-17 19:25:04.448491+02	20251017172504_add_progress_reports	\N	\N	2025-10-17 19:25:04.435623+02	1
1c59c785-45d6-4ac5-9161-38179daeb673	23c21a7577020d7bde41928e31bc9395175865fde0b61eeaf8ed1bf56bda6aa5	2025-10-18 11:05:48.738942+02	20251018090548_add_amount_field	\N	\N	2025-10-18 11:05:48.731782+02	1
f965c620-144a-4fb5-abbd-b7a9e026dbc2	b62a3e772b0df366aa67ca165d2e2d778ff6f708eb76b720db73814e637e5793	2025-10-18 11:13:11.920233+02	20251018091311_add_currencies	\N	\N	2025-10-18 11:13:11.916292+02	1
5c3bcf61-e08f-42c7-bd22-e90deb2ca461	ede9a6cd104e2c3ae43c97011f9e8204253eee61ba61dc0d30dd487aea91fddd	2025-10-27 15:41:48.439464+01	20251027144148_remove_legacy_needusd_needpkr_fields	\N	\N	2025-10-27 15:41:48.432102+01	1
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, "studentId", term, status, "submittedAt", notes, "fxRate", currency, "amountOriginal", "currencyOriginal", "amountBaseUSD", "baseCurrency", "fxRateToUSD", "fxAsOf", "tuitionFee", "hostelFee", "otherExpenses", "familyIncome", "familyContribution", purpose, "approvalReason", "livingExpenses", "scholarshipAmount", "totalExpense", "universityFee", amount) FROM stdin;
cmh8xjr6600029eaecz34u8bw	cmh8xfz0o00009eaepftdsr8c	2026	APPROVED	2025-10-27 09:23:08.237	Approved by Admin on 27/10/2025\n[FORCE APPROVED despite missing documents]	\N	GBP	12000	GBP	\N	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	5000	8000	20000	15000	12000
cmh9406k0000411oew9vwskl2	cmh93z78l000011oeb87oexs7	2025	APPROVED	2025-10-27 12:23:52.366	Approved by Admin on 27/10/2025\n[FORCE APPROVED despite missing documents]	\N	AUD	10000	AUD	\N	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	5000	5000	15000	10000	10000
cmh9ehzrd0001qmp6ic8l9lxs	cmh91zy2r0000t8pu39a02ifb	2025	PENDING	2025-10-27 17:17:39.525	\N	\N	EUR	14000	EUR	\N	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	6000	10000	24000	18000	14000
\.


--
-- Data for Name: conversation_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversation_messages (id, "conversationId", "senderId", "senderRole", text, "createdAt", "readBy") FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, type, "participantIds", "studentId", "applicationId", "createdAt", "updatedAt", "lastMessageAt") FROM stdin;
\.


--
-- Data for Name: disbursements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disbursements (id, "studentId", amount, date, status, notes, "amountOriginal", "currencyOriginal", "amountBaseUSD", "baseCurrency", "fxRateToUSD", "fxAsOf") FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, "studentId", "applicationId", type, url, "originalName", "mimeType", size, "uploadedAt") FROM stdin;
cmh8xk3yx00049eaeomqywkux	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	OTHER	/uploads/1761557004818-508912798.pdf	CNIC.pdf	application/pdf	30518	2025-10-27 09:23:24.825
cmh8xl4h600069eaexaoggl87	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	GUARDIAN_CNIC	/uploads/1761557052131-526756579.pdf	GUardian CNIC.pdf	application/pdf	80382	2025-10-27 09:24:12.138
cmh8xlbyu00089eaegdiac9y4	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	CNIC	/uploads/1761557061842-777003975.pdf	CNIC.pdf	application/pdf	30518	2025-10-27 09:24:21.847
cmh8xm2g2000a9eae6dy3vhfa	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	SSC_RESULT	/uploads/1761557096158-991929381.pdf	SSC_REUSULT.pdf	application/pdf	27055	2025-10-27 09:24:56.162
cmh8xmagq000c9eaezozxxm46	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	HSSC_RESULT	/uploads/1761557106546-789339893.pdf	HSSC.pdf	application/pdf	79601	2025-10-27 09:25:06.554
cmh8xml6k000e9eaebrj4u1em	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	PHOTO	/uploads/1761557120438-733267253.pdf	PHOTO.pdf	application/pdf	77901	2025-10-27 09:25:20.444
cmh8xmtfb000g9eaec8sqssfy	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	UNIVERSITY_CARD	/uploads/1761557131122-657661778.pdf	UNIVERSTITY_CARD.pdf	application/pdf	76434	2025-10-27 09:25:31.127
cmh8xn1po000i9eaeseei9n1q	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	FEE_INVOICE	/uploads/1761557141863-617913551.pdf	FEE_INVOICE.pdf	application/pdf	77325	2025-10-27 09:25:41.868
cmh8xnafj000k9eaegw9mnk2x	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	INCOME_CERTIFICATE	/uploads/1761557153161-622548897.pdf	INCOME_CERTIFICATE.pdf	application/pdf	77155	2025-10-27 09:25:53.167
cmh8xngp0000m9eaevn8oq8y3	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	UTILITY_BILL	/uploads/1761557161276-213035490.pdf	UTILITY_BILL.pdf	application/pdf	76875	2025-10-27 09:26:01.284
cmh8ygyt700119eaegle2obdk	cmh8xfz0o00009eaepftdsr8c	cmh8xjr6600029eaecz34u8bw	TRANSCRIPT	/uploads/1761558537784-914559277.pdf	TRANSCRIPT.pdf	application/pdf	71176	2025-10-27 09:48:57.787
cmh94eztj000113lpf1snqxb0	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2	CNIC	/uploads/1761568523419-354671742.pdf	CNIC.pdf	application/pdf	30518	2025-10-27 12:35:23.479
cmh94f4gf000313lpjtr2j8lx	cmh93z78l000011oeb87oexs7	\N	OTHER	/uploads/1761568529480-441825965.txt	debug-upload.txt	text/plain	42	2025-10-27 12:35:29.487
cmh94gtfn000513lpmgd34k3m	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2	GUARDIAN_CNIC	/uploads/1761568608502-752991071.pdf	GUardian CNIC.pdf	application/pdf	80382	2025-10-27 12:36:48.515
cmh94h9tp000713lp9hkej2em	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2	HSSC_RESULT	/uploads/1761568629744-296750185.pdf	HSSC.pdf	application/pdf	79601	2025-10-27 12:37:09.757
cmh94ho9g000913lpdrin3p5q	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2	PHOTO	/uploads/1761568648465-194047538.pdf	PHOTO.pdf	application/pdf	77901	2025-10-27 12:37:28.468
cmh94i1e2000b13lpr6imlik0	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2	UNIVERSITY_CARD	/uploads/1761568665477-937545483.pdf	UNIVERSTITY_CARD.pdf	application/pdf	76434	2025-10-27 12:37:45.481
cmh94id5u000d13lpmw82gxql	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2	FEE_INVOICE	/uploads/1761568680733-281283920.pdf	FEE_INVOICE.pdf	application/pdf	77325	2025-10-27 12:38:00.738
cmh94isja000f13lpvrgx6r8f	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2	INCOME_CERTIFICATE	/uploads/1761568700658-6212798.pdf	INCOME_CERTIFICATE.pdf	application/pdf	77155	2025-10-27 12:38:20.662
cmh94j2v6000h13lpm0cpms2x	cmh93z78l000011oeb87oexs7	cmh9406k0000411oew9vwskl2	UTILITY_BILL	/uploads/1761568714045-645949832.pdf	UTILITY_BILL.pdf	application/pdf	76875	2025-10-27 12:38:34.05
cmh9g1m8r000111ivi68pghpk	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	CNIC	/uploads/1761588054736-952016081.pdf	CNIC.pdf	application/pdf	30518	2025-10-27 18:00:54.745
cmh9g1sxn000311ivwdhtr9re	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	GUARDIAN_CNIC	/uploads/1761588063413-164185696.pdf	GUardian CNIC.pdf	application/pdf	80382	2025-10-27 18:01:03.418
cmh9g26u3000511ivmybg747r	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	PHOTO	/uploads/1761588081430-203843466.pdf	PHOTO.pdf	application/pdf	77901	2025-10-27 18:01:21.435
cmh9g2dt1000711ivr885mpxi	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	SSC_RESULT	/uploads/1761588090464-648646798.pdf	SSC_REUSULT.pdf	application/pdf	27055	2025-10-27 18:01:30.469
cmh9g2kxa000911iv802cqmkj	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	HSSC_RESULT	/uploads/1761588099688-711593525.pdf	HSSC.pdf	application/pdf	79601	2025-10-27 18:01:39.694
cmh9g2sf5000b11ivym2b9ku8	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	UNIVERSITY_CARD	/uploads/1761588109402-986602178.pdf	UNIVERSTITY_CARD.pdf	application/pdf	76434	2025-10-27 18:01:49.41
cmh9g343t000d11ivemdvlley	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	FEE_INVOICE	/uploads/1761588124548-583172664.pdf	FEE_INVOICE.pdf	application/pdf	77325	2025-10-27 18:02:04.553
cmh9g3c5y000f11ivcmb2q5a8	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	INCOME_CERTIFICATE	/uploads/1761588134994-905619211.pdf	INCOME_CERTIFICATE.pdf	application/pdf	77155	2025-10-27 18:02:14.999
cmh9g3kis000h11ivdmpc5btu	cmh91zy2r0000t8pu39a02ifb	cmh9ehzrd0001qmp6ic8l9lxs	UTILITY_BILL	/uploads/1761588145823-945373237.pdf	UTILITY_BILL.pdf	application/pdf	76875	2025-10-27 18:02:25.828
\.


--
-- Data for Name: donors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donors (id, name, email, organization, "totalFunded", "createdAt", "updatedAt", country, address, "currencyPreference", "taxId", phone) FROM stdin;
cmh8ymxpv00129eaerlrd4b17	Donor one	test+21@webciters.com	\N	0	2025-10-27 09:53:36.307	2025-10-27 09:53:36.307	Canada	\N	\N	\N	0012587412563
\.


--
-- Data for Name: field_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.field_reviews (id, "applicationId", "studentId", "officerUserId", status, notes, recommendation, "homeVisitDate", "homeVisitNotes", "familyInterviewNotes", "financialVerificationNotes", "characterAssessment", "deservingnessFactor", "documentsVerified", "identityVerified", "familyIncomeVerified", "educationVerified", "recommendationReason", "additionalDocumentsRequested", "riskFactors", "verificationScore", "fielderRecommendation", "adminNotesRequired", "createdAt", "updatedAt") FROM stdin;
cmh8xxyyq000r9eae67ybjyoz	cmh8xjr6600029eaecz34u8bw	cmh8xfz0o00009eaepftdsr8c	cmh8xxfg7000p9eaea4f9ecw3	COMPLETED			\N					5	f	f	f	f	I think he is a surely good student and we must approve him.	{}	{}	50	APPROVE		2025-10-27 09:34:11.522	2025-10-27 09:46:17.984
cmh94k7is000l13lpbu7kmlwi	cmh9406k0000411oew9vwskl2	cmh93z78l000011oeb87oexs7	cmh8xxfg7000p9eaea4f9ecw3	COMPLETED	ASFD	APPROVE	2025-10-25 00:00:00	DONE 	DONE	DONE	DONE	5	f	f	f	f	DONE	{}	{}	50	APPROVE	DONE	2025-10-27 12:39:26.741	2025-10-27 12:46:55.266
cmh9g4tt3000m11ivn8qeh450	cmh9ehzrd0001qmp6ic8l9lxs	cmh91zy2r0000t8pu39a02ifb	cmh9g4o37000k11iv81wivg8o	PENDING	\N	\N	\N	\N	\N	\N	\N	\N	f	f	f	f	\N	\N	\N	\N	\N	\N	2025-10-27 18:03:24.519	2025-10-27 18:03:24.519
\.


--
-- Data for Name: fx_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fx_rates (id, base, quote, rate, "asOf", source) FROM stdin;
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_resets (id, "userId", token, "expiresAt", used) FROM stdin;
\.


--
-- Data for Name: progress_report_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progress_report_attachments (id, "progressReportId", filename, filepath, mimetype, size, "createdAt") FROM stdin;
\.


--
-- Data for Name: progress_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progress_reports (id, "studentId", title, content, status, "createdAt", "updatedAt", "reviewedAt", "reviewedBy", "reviewNotes") FROM stdin;
\.


--
-- Data for Name: sponsorships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sponsorships (id, "donorId", "studentId", amount, date, status, "paymentFrequency", "stripePaymentIntentId", "stripeSubscriptionId", "amountOriginal", "currencyOriginal", "amountBaseUSD", "baseCurrency", "fxRateToUSD", "fxAsOf") FROM stdin;
\.


--
-- Data for Name: student_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_progress (id, "studentId", term, gpa, "coursesCompleted", "creditsEarned", achievements, challenges, goals, notes, "updateType", documents, "submittedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, name, email, gender, university, field, program, gpa, "gradYear", city, country, province, sponsored, "studentPhase", "createdAt", "updatedAt", cnic, "dateOfBirth", "guardianName", "guardianCnic", phone, address, "currentInstitution", "currentCity", "currentCompletionYear", "personalIntroduction", "academicAchievements", "careerGoals", "communityInvolvement", "currentAcademicYear", "familySize", "monthlyFamilyIncome", "parentsOccupation", "specificField") FROM stdin;
cmh93z78l000011oeb87oexs7	Shumaila Shah	test+3@webciters.com	F	University of Melbourne	MBBS	MBBS	3.5	2027	Karachi	Pakistan	Sindh	f	ACTIVE	2025-10-27 12:23:06.566	2025-10-27 12:48:45.567	69857-4125566-2	2003-01-02 00:00:00	Shah ji	74125-8963214-5	0300 825416542	85 Shah ji Road,	FSc	Lahore	2025	Tell us about yourself and your family (Optional but recommended)Tell us about yourself and your family (This helps potential sponsors understand your story)	Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  	Career Goals & Aspirations.  Career Goals & Aspirations.  Career Goals & Aspirations.  Career Goals & Aspirations.  Career Goals & Aspirations.  Career Goals & Aspirations.  	Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Comm	2nd Year	3	Less than ₨25,000	Farmer	Specific Field/Specialization
cmh91zy2r0000t8pu39a02ifb	Hamid Khan	test+2@webciters.com	M	Ludwig Maximilian University of Munich	Engineering	Engineering	3.6	2028	Karachi	Pakistan	Sindh	f	APPLICATION	2025-10-27 11:27:42.108	2025-10-27 18:00:40.531	96666-6666666-6	2006-02-01 00:00:00	Salam Ji	11111-1111111-1	0300 852 4152	36 Ayubia Street	Karachi College	Karachi	2025	Tell us about yourself and your family (This helps potential sponsors understand your story)	Academic Achievements & Awards	Career Goals & Aspirations	Community Involvement & Leadership	2nd Year	4	₨25,000-50,000	Small Stall Holder	Specific Field/Specialization
cmh8xfz0o00009eaepftdsr8c	Jamshaid Hameed	test+1@webciters.com	M	University of Oxford	AI Engineering	AI Engineering	3.9	2028	Lahore	Pakistan	Punjab	f	ACTIVE	2025-10-27 09:20:11.783	2025-10-27 11:50:05.019	25874-1326655-5	2005-02-01 00:00:00	Hameed Sb	98745-6321452-1	0300 448 5254	335 Sulatan Street,	Islamia College	Lahore	2025	Tell us about yourself and your family (This helps potential sponsors understand your story)	Academic Achievements & Awards	Career Goals & Aspirations	Community Involvement & Leadership	2nd Year	10	Less than ₨25,000	Teacher	Specific Field/Specialization
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, "passwordHash", role, "studentId", "donorId", "createdAt", "updatedAt") FROM stdin;
cmgw2ia6y0000dzhvl1ct1e43	System Administrator	admin@awake.com	$2b$10$U37/9oRb8AN3j.mJevFFLOYgxfu/rZQTe1KQkoyUGMdE/ot69MXI6	ADMIN	\N	\N	2025-10-18 09:20:57.371	2025-10-23 12:15:57.951
cmh3k87fe0000xc9lsvm8n8xs	Muhammad Amin	test+1@webciters.com	$2a$10$5oT/aAZD1XofGz8KvueU5OsAxn30UF6j4ShQwm6SbelasrZ0T3OqG	STUDENT	cmh8xfz0o00009eaepftdsr8c	\N	2025-10-23 15:11:23.541	2025-10-27 09:20:11.911
cmh8xxfg7000p9eaea4f9ecw3	Eshan Ulla	test+31@webciters.com	$2a$10$2ZKG4O4fBSilXutShxPrEeINgWhQYxVmbn./ZEljlGT31uYEAyyyq	SUB_ADMIN	\N	\N	2025-10-27 09:33:46.231	2025-10-27 09:33:46.231
cmh8ymxt200149eaeo4zbrwlz	\N	test+21@webciters.com	$2a$10$zVRB.6UfLgmcKgGJ0FDoI.GzBFNPZADtgDsC7XhCy5bF1JZ.DH37q	DONOR	\N	cmh8ymxpv00129eaerlrd4b17	2025-10-27 09:53:36.422	2025-10-27 09:53:36.422
cmh3k8gdt0001xc9le8wysdji	Sultan Khan	test+2@webciters.com	$2a$10$V5pESSRTUhMV8YRsgiHtRutsSlYQkoRotL42l9nBNkyOMPL6n0Nl2	STUDENT	cmh91zy2r0000t8pu39a02ifb	\N	2025-10-23 15:11:35.153	2025-10-27 11:27:42.307
cmh93z7dx000211oeank8ba6s	\N	test+3@webciters.com	$2a$10$xzHQfcsOwe4MtI7GgfOZ2uFxQXlv2vit2TVtofgJBW5r1nHb3QSPu	STUDENT	cmh93z78l000011oeb87oexs7	\N	2025-10-27 12:23:06.787	2025-10-27 12:23:06.787
cmh9g4o37000k11iv81wivg8o	Roger Moore	test+32@webciters.com	$2a$10$ud2SYd/7DXsEJ74WamOM6OdkZWZSF2dtwxJUjgmeAWfU7ZCYF9iIG	SUB_ADMIN	\N	\N	2025-10-27 18:03:17.107	2025-10-27 18:03:17.107
\.


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: conversation_messages conversation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: disbursements disbursements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT disbursements_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: donors donors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_pkey PRIMARY KEY (id);


--
-- Name: field_reviews field_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT field_reviews_pkey PRIMARY KEY (id);


--
-- Name: fx_rates fx_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fx_rates
    ADD CONSTRAINT fx_rates_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: progress_report_attachments progress_report_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_report_attachments
    ADD CONSTRAINT progress_report_attachments_pkey PRIMARY KEY (id);


--
-- Name: progress_reports progress_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_reports
    ADD CONSTRAINT progress_reports_pkey PRIMARY KEY (id);


--
-- Name: sponsorships sponsorships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsorships
    ADD CONSTRAINT sponsorships_pkey PRIMARY KEY (id);


--
-- Name: student_progress student_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: conversation_messages_conversationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "conversation_messages_conversationId_idx" ON public.conversation_messages USING btree ("conversationId");


--
-- Name: conversation_messages_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "conversation_messages_senderId_idx" ON public.conversation_messages USING btree ("senderId");


--
-- Name: documents_applicationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "documents_applicationId_idx" ON public.documents USING btree ("applicationId");


--
-- Name: documents_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "documents_studentId_idx" ON public.documents USING btree ("studentId");


--
-- Name: donors_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX donors_email_key ON public.donors USING btree (email);


--
-- Name: field_reviews_applicationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "field_reviews_applicationId_idx" ON public.field_reviews USING btree ("applicationId");


--
-- Name: field_reviews_officerUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "field_reviews_officerUserId_idx" ON public.field_reviews USING btree ("officerUserId");


--
-- Name: field_reviews_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "field_reviews_studentId_idx" ON public.field_reviews USING btree ("studentId");


--
-- Name: fx_rates_base_quote_asOf_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "fx_rates_base_quote_asOf_key" ON public.fx_rates USING btree (base, quote, "asOf");


--
-- Name: password_resets_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX password_resets_token_key ON public.password_resets USING btree (token);


--
-- Name: password_resets_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "password_resets_userId_idx" ON public.password_resets USING btree ("userId");


--
-- Name: student_progress_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "student_progress_studentId_idx" ON public.student_progress USING btree ("studentId");


--
-- Name: student_progress_submittedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "student_progress_submittedAt_idx" ON public.student_progress USING btree ("submittedAt");


--
-- Name: students_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX students_email_key ON public.students USING btree (email);


--
-- Name: users_donorId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "users_donorId_key" ON public.users USING btree ("donorId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_studentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "users_studentId_key" ON public.users USING btree ("studentId");


--
-- Name: Message Message_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: applications applications_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT "applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_messages conversation_messages_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT "conversation_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_messages conversation_messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT "conversation_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: conversations conversations_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "conversations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversations conversations_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "conversations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: disbursements disbursements_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disbursements
    ADD CONSTRAINT "disbursements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: field_reviews field_reviews_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT "field_reviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: field_reviews field_reviews_officerUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT "field_reviews_officerUserId_fkey" FOREIGN KEY ("officerUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: field_reviews field_reviews_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_reviews
    ADD CONSTRAINT "field_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_resets password_resets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: progress_report_attachments progress_report_attachments_progressReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_report_attachments
    ADD CONSTRAINT "progress_report_attachments_progressReportId_fkey" FOREIGN KEY ("progressReportId") REFERENCES public.progress_reports(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: progress_reports progress_reports_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress_reports
    ADD CONSTRAINT "progress_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sponsorships sponsorships_donorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsorships
    ADD CONSTRAINT "sponsorships_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES public.donors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sponsorships sponsorships_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsorships
    ADD CONSTRAINT "sponsorships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_progress student_progress_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT "student_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_donorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES public.donors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict lrGpgAigq4EpU0KQNSbZYPeMeHp5fwc14izC3DI0ijb5H7OjdxvMTJ46qh5HXHC

