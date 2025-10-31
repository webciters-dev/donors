--
-- PostgreSQL database dump
--

\restrict E12Xuj7vwmuZDdvtM4k5Tw4f0VAEHI8wYT3Zaf4TOkIvuETIlx6TbcFQob4eVEL

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
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.students VALUES ('cmh93z78l000011oeb87oexs7', 'Shumaila Shah', 'test+3@webciters.com', 'F', 'University of Melbourne', 'MBBS', 'MBBS', 3.5, 2027, 'Karachi', 'Pakistan', 'Sindh', false, 'ACTIVE', '2025-10-27 12:23:06.566', '2025-10-27 12:48:45.567', '69857-4125566-2', '2003-01-02 00:00:00', 'Shah ji', '74125-8963214-5', '0300 825416542', '85 Shah ji Road,', 'FSc', 'Lahore', 2025, 'Tell us about yourself and your family (Optional but recommended)Tell us about yourself and your family (This helps potential sponsors understand your story)', 'Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  Academic Achievements & Awards.  ', 'Career Goals & Aspirations.  Career Goals & Aspirations.  Career Goals & Aspirations.  Career Goals & Aspirations.  Career Goals & Aspirations.  Career Goals & Aspirations.  ', 'Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Community Involvement & Leadership.  Comm', '2nd Year', 3, 'Less than ₨25,000', 'Farmer', 'Specific Field/Specialization');
INSERT INTO public.students VALUES ('cmh91zy2r0000t8pu39a02ifb', 'Hamid Khan', 'test+2@webciters.com', 'M', 'Ludwig Maximilian University of Munich', 'Engineering', 'Engineering', 3.6, 2028, 'Karachi', 'Pakistan', 'Sindh', false, 'APPLICATION', '2025-10-27 11:27:42.108', '2025-10-27 18:00:40.531', '96666-6666666-6', '2006-02-01 00:00:00', 'Salam Ji', '11111-1111111-1', '0300 852 4152', '36 Ayubia Street', 'Karachi College', 'Karachi', 2025, 'Tell us about yourself and your family (This helps potential sponsors understand your story)', 'Academic Achievements & Awards', 'Career Goals & Aspirations', 'Community Involvement & Leadership', '2nd Year', 4, '₨25,000-50,000', 'Small Stall Holder', 'Specific Field/Specialization');
INSERT INTO public.students VALUES ('cmh8xfz0o00009eaepftdsr8c', 'Jamshaid Hameed', 'test+1@webciters.com', 'M', 'University of Oxford', 'AI Engineering', 'AI Engineering', 3.9, 2028, 'Lahore', 'Pakistan', 'Punjab', false, 'ACTIVE', '2025-10-27 09:20:11.783', '2025-10-27 11:50:05.019', '25874-1326655-5', '2005-02-01 00:00:00', 'Hameed Sb', '98745-6321452-1', '0300 448 5254', '335 Sulatan Street,', 'Islamia College', 'Lahore', 2025, 'Tell us about yourself and your family (This helps potential sponsors understand your story)', 'Academic Achievements & Awards', 'Career Goals & Aspirations', 'Community Involvement & Leadership', '2nd Year', 10, 'Less than ₨25,000', 'Teacher', 'Specific Field/Specialization');


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.applications VALUES ('cmh8xjr6600029eaecz34u8bw', 'cmh8xfz0o00009eaepftdsr8c', '2026', 'APPROVED', '2025-10-27 09:23:08.237', 'Approved by Admin on 27/10/2025
[FORCE APPROVED despite missing documents]', NULL, 'GBP', 12000, 'GBP', NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5000, 8000, 20000, 15000, 12000);
INSERT INTO public.applications VALUES ('cmh9406k0000411oew9vwskl2', 'cmh93z78l000011oeb87oexs7', '2025', 'APPROVED', '2025-10-27 12:23:52.366', 'Approved by Admin on 27/10/2025
[FORCE APPROVED despite missing documents]', NULL, 'AUD', 10000, 'AUD', NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5000, 5000, 15000, 10000, 10000);
INSERT INTO public.applications VALUES ('cmh9ehzrd0001qmp6ic8l9lxs', 'cmh91zy2r0000t8pu39a02ifb', '2025', 'PENDING', '2025-10-27 17:17:39.525', NULL, NULL, 'EUR', 14000, 'EUR', NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6000, 10000, 24000, 18000, 14000);


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Message" VALUES ('cmh8xqyym000o9eae0io8p1y5', 'Submitted application for review.', 'student', '2025-10-27 09:28:44.926', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw');
INSERT INTO public."Message" VALUES ('cmh8y29n4000t9eaex97jve3o', 'Hi Jamshaid - I may be coming to your home next week.  Will call your dad to confirm.', 'sub_admin', '2025-10-27 09:37:31.984', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw');
INSERT INTO public."Message" VALUES ('cmh8y8chq000v9eaexernow0z', 'Awake: Additional documents required - Updated Income Certificate. These documents are required to complete your field verification process.', 'admin', '2025-10-27 09:42:15.614', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw');
INSERT INTO public."Message" VALUES ('cmh8ycb6i000x9eae4cp28f5g', 'I will send this soon', 'student', '2025-10-27 09:45:20.538', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw');
INSERT INTO public."Message" VALUES ('cmh8ydjif000z9eaerk2xfwhk', 'Awake: Verification completed by Eshan Ulla. Recommendation: approve. Your application is now under review.', 'admin', '2025-10-27 09:46:17.991', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw');
INSERT INTO public."Message" VALUES ('cmh94jl48000j13lp19vv2a0c', 'Submitted application for review.', 'student', '2025-10-27 12:38:57.704', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2');
INSERT INTO public."Message" VALUES ('cmh94l97r000n13lpiubx3f7n', 'Message from sub admin to student - please respond', 'sub_admin', '2025-10-27 12:40:15.591', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2');
INSERT INTO public."Message" VALUES ('cmh94mfbq000p13lpp9sz1h7m', 'Message from sub admin to student - HERE IS THE RESPONSE', 'student', '2025-10-27 12:41:10.167', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2');
INSERT INTO public."Message" VALUES ('cmh94o8vq000r13lpkdiv1e54', 'Awake: Verification completed by Eshan Ulla. Recommendation: approve. Your application is now under review.', 'admin', '2025-10-27 12:42:35.127', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2');
INSERT INTO public."Message" VALUES ('cmh94qsoo000t13lp91sg5s7s', 'Awake: Verification completed by Eshan Ulla. . Your application is now under review.', 'admin', '2025-10-27 12:44:34.104', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2');
INSERT INTO public."Message" VALUES ('cmh94ttly000v13lphyd6af5p', 'Awake: Verification completed by Eshan Ulla. Recommendation: approve. Your application is now under review.', 'admin', '2025-10-27 12:46:55.27', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2');
INSERT INTO public."Message" VALUES ('cmh9g3ujm000j11ivvcgtmool', 'Submitted application for review.', 'student', '2025-10-27 18:02:38.818', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs');


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations VALUES ('62082660-09c0-485e-a2c7-0e1013f91179', '85067bd9c5bf7659b74db2c590362a8ba92413387a90d4a855547f633d0194b4', '2025-10-17 18:55:43.310557+02', '20251017165541_initial_complete_schema', NULL, NULL, '2025-10-17 18:55:43.205068+02', 1);
INSERT INTO public._prisma_migrations VALUES ('bce89c54-899e-4413-a0db-a1527882f09e', '244d812a661d750cf4c0debb30eeee9a1fb6363f15bd29d05cb881ee5e4874ba', '2025-10-17 19:25:04.448491+02', '20251017172504_add_progress_reports', NULL, NULL, '2025-10-17 19:25:04.435623+02', 1);
INSERT INTO public._prisma_migrations VALUES ('1c59c785-45d6-4ac5-9161-38179daeb673', '23c21a7577020d7bde41928e31bc9395175865fde0b61eeaf8ed1bf56bda6aa5', '2025-10-18 11:05:48.738942+02', '20251018090548_add_amount_field', NULL, NULL, '2025-10-18 11:05:48.731782+02', 1);
INSERT INTO public._prisma_migrations VALUES ('f965c620-144a-4fb5-abbd-b7a9e026dbc2', 'b62a3e772b0df366aa67ca165d2e2d778ff6f708eb76b720db73814e637e5793', '2025-10-18 11:13:11.920233+02', '20251018091311_add_currencies', NULL, NULL, '2025-10-18 11:13:11.916292+02', 1);
INSERT INTO public._prisma_migrations VALUES ('5c3bcf61-e08f-42c7-bd22-e90deb2ca461', 'ede9a6cd104e2c3ae43c97011f9e8204253eee61ba61dc0d30dd487aea91fddd', '2025-10-27 15:41:48.439464+01', '20251027144148_remove_legacy_needusd_needpkr_fields', NULL, NULL, '2025-10-27 15:41:48.432102+01', 1);


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: donors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.donors VALUES ('cmh8ymxpv00129eaerlrd4b17', 'Donor one', 'test+21@webciters.com', NULL, 0, '2025-10-27 09:53:36.307', '2025-10-27 09:53:36.307', 'Canada', NULL, NULL, NULL, '0012587412563');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES ('cmgw2ia6y0000dzhvl1ct1e43', 'System Administrator', 'admin@awake.com', '$2b$10$U37/9oRb8AN3j.mJevFFLOYgxfu/rZQTe1KQkoyUGMdE/ot69MXI6', 'ADMIN', NULL, NULL, '2025-10-18 09:20:57.371', '2025-10-23 12:15:57.951');
INSERT INTO public.users VALUES ('cmh3k87fe0000xc9lsvm8n8xs', 'Muhammad Amin', 'test+1@webciters.com', '$2a$10$5oT/aAZD1XofGz8KvueU5OsAxn30UF6j4ShQwm6SbelasrZ0T3OqG', 'STUDENT', 'cmh8xfz0o00009eaepftdsr8c', NULL, '2025-10-23 15:11:23.541', '2025-10-27 09:20:11.911');
INSERT INTO public.users VALUES ('cmh8xxfg7000p9eaea4f9ecw3', 'Eshan Ulla', 'test+31@webciters.com', '$2a$10$2ZKG4O4fBSilXutShxPrEeINgWhQYxVmbn./ZEljlGT31uYEAyyyq', 'SUB_ADMIN', NULL, NULL, '2025-10-27 09:33:46.231', '2025-10-27 09:33:46.231');
INSERT INTO public.users VALUES ('cmh8ymxt200149eaeo4zbrwlz', NULL, 'test+21@webciters.com', '$2a$10$zVRB.6UfLgmcKgGJ0FDoI.GzBFNPZADtgDsC7XhCy5bF1JZ.DH37q', 'DONOR', NULL, 'cmh8ymxpv00129eaerlrd4b17', '2025-10-27 09:53:36.422', '2025-10-27 09:53:36.422');
INSERT INTO public.users VALUES ('cmh3k8gdt0001xc9le8wysdji', 'Sultan Khan', 'test+2@webciters.com', '$2a$10$V5pESSRTUhMV8YRsgiHtRutsSlYQkoRotL42l9nBNkyOMPL6n0Nl2', 'STUDENT', 'cmh91zy2r0000t8pu39a02ifb', NULL, '2025-10-23 15:11:35.153', '2025-10-27 11:27:42.307');
INSERT INTO public.users VALUES ('cmh93z7dx000211oeank8ba6s', NULL, 'test+3@webciters.com', '$2a$10$xzHQfcsOwe4MtI7GgfOZ2uFxQXlv2vit2TVtofgJBW5r1nHb3QSPu', 'STUDENT', 'cmh93z78l000011oeb87oexs7', NULL, '2025-10-27 12:23:06.787', '2025-10-27 12:23:06.787');
INSERT INTO public.users VALUES ('cmh9g4o37000k11iv81wivg8o', 'Roger Moore', 'test+32@webciters.com', '$2a$10$ud2SYd/7DXsEJ74WamOM6OdkZWZSF2dtwxJUjgmeAWfU7ZCYF9iIG', 'SUB_ADMIN', NULL, NULL, '2025-10-27 18:03:17.107', '2025-10-27 18:03:17.107');


--
-- Data for Name: conversation_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: disbursements; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.documents VALUES ('cmh8xk3yx00049eaeomqywkux', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'OTHER', '/uploads/1761557004818-508912798.pdf', 'CNIC.pdf', 'application/pdf', 30518, '2025-10-27 09:23:24.825');
INSERT INTO public.documents VALUES ('cmh8xl4h600069eaexaoggl87', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'GUARDIAN_CNIC', '/uploads/1761557052131-526756579.pdf', 'GUardian CNIC.pdf', 'application/pdf', 80382, '2025-10-27 09:24:12.138');
INSERT INTO public.documents VALUES ('cmh8xlbyu00089eaegdiac9y4', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'CNIC', '/uploads/1761557061842-777003975.pdf', 'CNIC.pdf', 'application/pdf', 30518, '2025-10-27 09:24:21.847');
INSERT INTO public.documents VALUES ('cmh8xm2g2000a9eae6dy3vhfa', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'SSC_RESULT', '/uploads/1761557096158-991929381.pdf', 'SSC_REUSULT.pdf', 'application/pdf', 27055, '2025-10-27 09:24:56.162');
INSERT INTO public.documents VALUES ('cmh8xmagq000c9eaezozxxm46', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'HSSC_RESULT', '/uploads/1761557106546-789339893.pdf', 'HSSC.pdf', 'application/pdf', 79601, '2025-10-27 09:25:06.554');
INSERT INTO public.documents VALUES ('cmh8xml6k000e9eaebrj4u1em', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'PHOTO', '/uploads/1761557120438-733267253.pdf', 'PHOTO.pdf', 'application/pdf', 77901, '2025-10-27 09:25:20.444');
INSERT INTO public.documents VALUES ('cmh8xmtfb000g9eaec8sqssfy', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'UNIVERSITY_CARD', '/uploads/1761557131122-657661778.pdf', 'UNIVERSTITY_CARD.pdf', 'application/pdf', 76434, '2025-10-27 09:25:31.127');
INSERT INTO public.documents VALUES ('cmh8xn1po000i9eaeseei9n1q', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'FEE_INVOICE', '/uploads/1761557141863-617913551.pdf', 'FEE_INVOICE.pdf', 'application/pdf', 77325, '2025-10-27 09:25:41.868');
INSERT INTO public.documents VALUES ('cmh8xnafj000k9eaegw9mnk2x', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'INCOME_CERTIFICATE', '/uploads/1761557153161-622548897.pdf', 'INCOME_CERTIFICATE.pdf', 'application/pdf', 77155, '2025-10-27 09:25:53.167');
INSERT INTO public.documents VALUES ('cmh8xngp0000m9eaevn8oq8y3', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'UTILITY_BILL', '/uploads/1761557161276-213035490.pdf', 'UTILITY_BILL.pdf', 'application/pdf', 76875, '2025-10-27 09:26:01.284');
INSERT INTO public.documents VALUES ('cmh8ygyt700119eaegle2obdk', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xjr6600029eaecz34u8bw', 'TRANSCRIPT', '/uploads/1761558537784-914559277.pdf', 'TRANSCRIPT.pdf', 'application/pdf', 71176, '2025-10-27 09:48:57.787');
INSERT INTO public.documents VALUES ('cmh94eztj000113lpf1snqxb0', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2', 'CNIC', '/uploads/1761568523419-354671742.pdf', 'CNIC.pdf', 'application/pdf', 30518, '2025-10-27 12:35:23.479');
INSERT INTO public.documents VALUES ('cmh94f4gf000313lpjtr2j8lx', 'cmh93z78l000011oeb87oexs7', NULL, 'OTHER', '/uploads/1761568529480-441825965.txt', 'debug-upload.txt', 'text/plain', 42, '2025-10-27 12:35:29.487');
INSERT INTO public.documents VALUES ('cmh94gtfn000513lpmgd34k3m', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2', 'GUARDIAN_CNIC', '/uploads/1761568608502-752991071.pdf', 'GUardian CNIC.pdf', 'application/pdf', 80382, '2025-10-27 12:36:48.515');
INSERT INTO public.documents VALUES ('cmh94h9tp000713lp9hkej2em', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2', 'HSSC_RESULT', '/uploads/1761568629744-296750185.pdf', 'HSSC.pdf', 'application/pdf', 79601, '2025-10-27 12:37:09.757');
INSERT INTO public.documents VALUES ('cmh94ho9g000913lpdrin3p5q', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2', 'PHOTO', '/uploads/1761568648465-194047538.pdf', 'PHOTO.pdf', 'application/pdf', 77901, '2025-10-27 12:37:28.468');
INSERT INTO public.documents VALUES ('cmh94i1e2000b13lpr6imlik0', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2', 'UNIVERSITY_CARD', '/uploads/1761568665477-937545483.pdf', 'UNIVERSTITY_CARD.pdf', 'application/pdf', 76434, '2025-10-27 12:37:45.481');
INSERT INTO public.documents VALUES ('cmh94id5u000d13lpmw82gxql', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2', 'FEE_INVOICE', '/uploads/1761568680733-281283920.pdf', 'FEE_INVOICE.pdf', 'application/pdf', 77325, '2025-10-27 12:38:00.738');
INSERT INTO public.documents VALUES ('cmh94isja000f13lpvrgx6r8f', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2', 'INCOME_CERTIFICATE', '/uploads/1761568700658-6212798.pdf', 'INCOME_CERTIFICATE.pdf', 'application/pdf', 77155, '2025-10-27 12:38:20.662');
INSERT INTO public.documents VALUES ('cmh94j2v6000h13lpm0cpms2x', 'cmh93z78l000011oeb87oexs7', 'cmh9406k0000411oew9vwskl2', 'UTILITY_BILL', '/uploads/1761568714045-645949832.pdf', 'UTILITY_BILL.pdf', 'application/pdf', 76875, '2025-10-27 12:38:34.05');
INSERT INTO public.documents VALUES ('cmh9g1m8r000111ivi68pghpk', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'CNIC', '/uploads/1761588054736-952016081.pdf', 'CNIC.pdf', 'application/pdf', 30518, '2025-10-27 18:00:54.745');
INSERT INTO public.documents VALUES ('cmh9g1sxn000311ivwdhtr9re', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'GUARDIAN_CNIC', '/uploads/1761588063413-164185696.pdf', 'GUardian CNIC.pdf', 'application/pdf', 80382, '2025-10-27 18:01:03.418');
INSERT INTO public.documents VALUES ('cmh9g26u3000511ivmybg747r', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'PHOTO', '/uploads/1761588081430-203843466.pdf', 'PHOTO.pdf', 'application/pdf', 77901, '2025-10-27 18:01:21.435');
INSERT INTO public.documents VALUES ('cmh9g2dt1000711ivr885mpxi', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'SSC_RESULT', '/uploads/1761588090464-648646798.pdf', 'SSC_REUSULT.pdf', 'application/pdf', 27055, '2025-10-27 18:01:30.469');
INSERT INTO public.documents VALUES ('cmh9g2kxa000911iv802cqmkj', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'HSSC_RESULT', '/uploads/1761588099688-711593525.pdf', 'HSSC.pdf', 'application/pdf', 79601, '2025-10-27 18:01:39.694');
INSERT INTO public.documents VALUES ('cmh9g2sf5000b11ivym2b9ku8', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'UNIVERSITY_CARD', '/uploads/1761588109402-986602178.pdf', 'UNIVERSTITY_CARD.pdf', 'application/pdf', 76434, '2025-10-27 18:01:49.41');
INSERT INTO public.documents VALUES ('cmh9g343t000d11ivemdvlley', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'FEE_INVOICE', '/uploads/1761588124548-583172664.pdf', 'FEE_INVOICE.pdf', 'application/pdf', 77325, '2025-10-27 18:02:04.553');
INSERT INTO public.documents VALUES ('cmh9g3c5y000f11ivcmb2q5a8', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'INCOME_CERTIFICATE', '/uploads/1761588134994-905619211.pdf', 'INCOME_CERTIFICATE.pdf', 'application/pdf', 77155, '2025-10-27 18:02:14.999');
INSERT INTO public.documents VALUES ('cmh9g3kis000h11ivdmpc5btu', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9ehzrd0001qmp6ic8l9lxs', 'UTILITY_BILL', '/uploads/1761588145823-945373237.pdf', 'UTILITY_BILL.pdf', 'application/pdf', 76875, '2025-10-27 18:02:25.828');


--
-- Data for Name: field_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.field_reviews VALUES ('cmh8xxyyq000r9eae67ybjyoz', 'cmh8xjr6600029eaecz34u8bw', 'cmh8xfz0o00009eaepftdsr8c', 'cmh8xxfg7000p9eaea4f9ecw3', 'COMPLETED', '', '', NULL, '', '', '', '', 5, false, false, false, false, 'I think he is a surely good student and we must approve him.', '{}', '{}', 50, 'APPROVE', '', '2025-10-27 09:34:11.522', '2025-10-27 09:46:17.984');
INSERT INTO public.field_reviews VALUES ('cmh94k7is000l13lpbu7kmlwi', 'cmh9406k0000411oew9vwskl2', 'cmh93z78l000011oeb87oexs7', 'cmh8xxfg7000p9eaea4f9ecw3', 'COMPLETED', 'ASFD', 'APPROVE', '2025-10-25 00:00:00', 'DONE ', 'DONE', 'DONE', 'DONE', 5, false, false, false, false, 'DONE', '{}', '{}', 50, 'APPROVE', 'DONE', '2025-10-27 12:39:26.741', '2025-10-27 12:46:55.266');
INSERT INTO public.field_reviews VALUES ('cmh9g4tt3000m11ivn8qeh450', 'cmh9ehzrd0001qmp6ic8l9lxs', 'cmh91zy2r0000t8pu39a02ifb', 'cmh9g4o37000k11iv81wivg8o', 'PENDING', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, false, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-27 18:03:24.519', '2025-10-27 18:03:24.519');


--
-- Data for Name: fx_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: progress_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: progress_report_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sponsorships; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: student_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

\unrestrict E12Xuj7vwmuZDdvtM4k5Tw4f0VAEHI8wYT3Zaf4TOkIvuETIlx6TbcFQob4eVEL

