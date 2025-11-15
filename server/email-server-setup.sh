#!/bin/bash
# Complete Email Server Setup for aircrew.nl
# Run as root on Ubuntu/Debian VPS: 136.144.175.93

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Professional Email Server Setup${NC}"
echo -e "${YELLOW}📧 Domain: aircrew.nl${NC}"
echo -e "${YELLOW}📍 Server: 136.144.175.93${NC}"

# Configuration
DOMAIN="aircrew.nl"
HOSTNAME="mail.aircrew.nl"
ADMIN_EMAIL="admin@aircrew.nl"

# Update system
echo -e "\n${GREEN}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Set hostname
echo -e "\n${GREEN}🏷️ Setting hostname...${NC}"
hostnamectl set-hostname $HOSTNAME
echo "127.0.0.1 $HOSTNAME" >> /etc/hosts

# Install required packages
echo -e "\n${GREEN}📥 Installing email server packages...${NC}"
apt install -y \
    postfix \
    dovecot-core \
    dovecot-imapd \
    dovecot-pop3d \
    dovecot-lmtpd \
    dovecot-mysql \
    mysql-server \
    postfix-mysql \
    mailutils \
    opendkim \
    opendkim-tools \
    spamassassin \
    spamc \
    clamav \
    clamav-daemon \
    fail2ban \
    ufw \
    certbot \
    python3-certbot-nginx \
    nginx

# Secure MySQL installation
echo -e "\n${GREEN}🔒 Securing MySQL...${NC}"
mysql_secure_installation

# Create mail database and user
echo -e "\n${GREEN}🗄️ Setting up mail database...${NC}"
mysql -u root -p << EOF
CREATE DATABASE mailserver;
CREATE USER 'mailuser'@'localhost' IDENTIFIED BY 'SecureMailPass2024!';
GRANT ALL PRIVILEGES ON mailserver.* TO 'mailuser'@'localhost';
FLUSH PRIVILEGES;

USE mailserver;

CREATE TABLE domains (
    id INT AUTO_INCREMENT,
    domain VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE users (
    id INT AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    quota BIGINT DEFAULT 1073741824,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
);

CREATE TABLE aliases (
    id INT AUTO_INCREMENT,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO domains (domain) VALUES ('aircrew.nl');
INSERT INTO users (email, password) VALUES 
    ('noreply@aircrew.nl', ENCRYPT('SecureNoreplyPass2024!', CONCAT('$6$', SUBSTRING(SHA(RAND()), -16))));
EOF

# Configure Postfix
echo -e "\n${GREEN}📮 Configuring Postfix...${NC}"
cat > /etc/postfix/main.cf << 'EOF'
# Basic Configuration
smtpd_banner = $myhostname ESMTP $mail_name
biff = no
append_dot_mydomain = no
readme_directory = no
compatibility_level = 2

# Network Configuration
myhostname = mail.aircrew.nl
mydomain = aircrew.nl
myorigin = $mydomain
inet_interfaces = all
inet_protocols = ipv4
mydestination = localhost

# Virtual Domain Configuration
virtual_mailbox_domains = mysql:/etc/postfix/mysql-virtual-mailbox-domains.cf
virtual_mailbox_maps = mysql:/etc/postfix/mysql-virtual-mailbox-maps.cf
virtual_alias_maps = mysql:/etc/postfix/mysql-virtual-alias-maps.cf
virtual_mailbox_base = /var/mail/vmail
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000

# TLS Configuration
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.aircrew.nl/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.aircrew.nl/privkey.pem
smtpd_tls_security_level = may
smtpd_tls_auth_only = yes
smtpd_tls_protocols = !SSLv2,!SSLv3,!TLSv1,!TLSv1.1
smtpd_tls_ciphers = medium
smtpd_tls_exclude_ciphers = MD5, SRP, PSK, aDSS, aNULL, eNULL, EXPORT, DES, RC4, MD5, PSK, SRP, DSS, AECDH, ADH

smtp_tls_security_level = may
smtp_tls_note_starttls_offer = yes
smtp_tls_protocols = !SSLv2,!SSLv3,!TLSv1,!TLSv1.1
smtp_tls_ciphers = medium

# SASL Authentication
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
broken_sasl_auth_clients = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain =

# Mail Queue Configuration
maximal_queue_lifetime = 7d
bounce_queue_lifetime = 7d
maximal_backoff_time = 4h
minimal_backoff_time = 300s
queue_run_delay = 300s

# Message Size Limits
message_size_limit = 52428800
mailbox_size_limit = 1073741824

# Rate Limiting
smtpd_recipient_limit = 50
smtpd_client_connection_count_limit = 10
smtpd_client_connection_rate_limit = 30
smtpd_client_message_rate_limit = 20
smtpd_client_recipient_rate_limit = 100

# Anti-Spam Configuration
smtpd_helo_required = yes
smtpd_delay_reject = yes
disable_vrfy_command = yes

# Restrictions
smtpd_helo_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_invalid_helo_hostname,
    reject_non_fqdn_helo_hostname

smtpd_sender_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_non_fqdn_sender,
    reject_unknown_sender_domain

smtpd_recipient_restrictions = 
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_non_fqdn_recipient,
    reject_unknown_recipient_domain,
    reject_unauth_destination,
    check_policy_service inet:127.0.0.1:10023

# Milter Configuration (DKIM)
milter_protocol = 6
milter_default_action = accept
smtpd_milters = inet:127.0.0.1:8891
non_smtpd_milters = inet:127.0.0.1:8891

# Logging
mail_log_file = /var/log/postfix.log
EOF

# Create virtual domain configuration files
echo -e "\n${GREEN}📝 Creating virtual domain configs...${NC}"

cat > /etc/postfix/mysql-virtual-mailbox-domains.cf << 'EOF'
user = mailuser
password = SecureMailPass2024!
hosts = localhost
dbname = mailserver
query = SELECT 1 FROM domains WHERE domain='%s'
EOF

cat > /etc/postfix/mysql-virtual-mailbox-maps.cf << 'EOF'
user = mailuser
password = SecureMailPass2024!
hosts = localhost
dbname = mailserver
query = SELECT 1 FROM users WHERE email='%s'
EOF

cat > /etc/postfix/mysql-virtual-alias-maps.cf << 'EOF'
user = mailuser
password = SecureMailPass2024!
hosts = localhost
dbname = mailserver
query = SELECT destination FROM aliases WHERE source='%s'
EOF

# Configure master.cf
echo -e "\n${GREEN}📋 Configuring Postfix master...${NC}"
cat > /etc/postfix/master.cf << 'EOF'
# Postfix master process configuration file
smtp      inet  n       -       y       -       -       smtpd
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=$mua_client_restrictions
  -o smtpd_helo_restrictions=$mua_helo_restrictions
  -o smtpd_sender_restrictions=$mua_sender_restrictions
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
smtps     inet  n       -       y       -       -       smtpd
  -o syslog_name=postfix/smtps
  -o smtpd_tls_wrappermode=yes
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=$mua_client_restrictions
  -o smtpd_helo_restrictions=$mua_helo_restrictions
  -o smtpd_sender_restrictions=$mua_sender_restrictions
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
pickup    unix  n       -       y       60      1       pickup
cleanup   unix  n       -       y       -       0       cleanup
qmgr      unix  n       -       n       300     1       qmgr
tlsmgr    unix  -       -       y       1000?   1       tlsmgr
rewrite   unix  -       -       y       -       -       trivial-rewrite
bounce    unix  -       -       y       -       0       bounce
defer     unix  -       -       y       -       0       bounce
trace     unix  -       -       y       -       0       bounce
verify    unix  -       -       y       -       1       verify
flush     unix  n       -       y       1000?   0       flush
proxymap  unix  -       -       n       -       -       proxymap
proxywrite unix -       -       n       -       1       proxymap
smtp      unix  -       -       y       -       -       smtp
relay     unix  -       -       y       -       -       smtp
showq     unix  n       -       y       -       -       showq
error     unix  -       -       y       -       -       error
retry     unix  -       -       y       -       -       error
discard   unix  -       -       y       -       -       discard
local     unix  -       n       n       -       -       local
virtual   unix  -       n       n       -       -       virtual
lmtp      unix  -       -       y       -       -       lmtp
anvil     unix  -       -       y       -       1       anvil
scache    unix  -       -       y       -       1       scache
EOF

# Create virtual mail user
echo -e "\n${GREEN}👤 Creating virtual mail user...${NC}"
useradd -r -u 5000 -g mail -d /var/mail/vmail -s /sbin/nologin -c "Virtual Mail User" vmail
mkdir -p /var/mail/vmail
chown -R vmail:mail /var/mail/vmail
chmod -R 770 /var/mail/vmail

# Configure Dovecot
echo -e "\n${GREEN}🕊️ Configuring Dovecot...${NC}"
cat > /etc/dovecot/dovecot.conf << 'EOF'
# Dovecot Configuration for aircrew.nl

# Protocols
protocols = imap pop3 lmtp

# Listen on all interfaces
listen = *

# Base directory
base_dir = /var/run/dovecot/

# Instance name
instance_name = dovecot

# Login settings
login_greeting = aircrew.nl IMAP/POP3 server ready.

# User/Group for mail processes
mail_uid = vmail
mail_gid = mail
first_valid_uid = 5000
last_valid_uid = 5000

# Mail location
mail_location = maildir:/var/mail/vmail/%d/%n/Maildir

# Authentication
auth_mechanisms = plain login

# Include configuration files
!include conf.d/*.conf
!include_try /usr/share/dovecot/protocols.d/*.protocol
EOF

# Configure Dovecot authentication
cat > /etc/dovecot/conf.d/10-auth.conf << 'EOF'
auth_mechanisms = plain login

!include auth-sql.conf.ext
EOF

cat > /etc/dovecot/conf.d/auth-sql.conf.ext << 'EOF'
passdb {
  driver = sql
  args = /etc/dovecot/dovecot-sql.conf.ext
}

userdb {
  driver = static
  args = uid=vmail gid=mail home=/var/mail/vmail/%d/%n
}
EOF

cat > /etc/dovecot/dovecot-sql.conf.ext << 'EOF'
driver = mysql
connect = host=localhost dbname=mailserver user=mailuser password=SecureMailPass2024!
default_pass_scheme = CRYPT
password_query = SELECT email as user, password FROM users WHERE email='%u'
EOF

# Configure Dovecot SSL
cat > /etc/dovecot/conf.d/10-ssl.conf << 'EOF'
ssl = required
ssl_cert = </etc/letsencrypt/live/mail.aircrew.nl/fullchain.pem
ssl_key = </etc/letsencrypt/live/mail.aircrew.nl/privkey.pem
ssl_protocols = !SSLv2 !SSLv3 !TLSv1 !TLSv1.1
ssl_cipher_list = ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!SHA1:!AESCCM
ssl_prefer_server_ciphers = yes
ssl_dh = </etc/dovecot/dh.pem
EOF

# Configure Dovecot IMAP
cat > /etc/dovecot/conf.d/20-imap.conf << 'EOF'
protocol imap {
  mail_max_userip_connections = 20
  imap_idle_notify_interval = 29 mins
}
EOF

# Configure Dovecot POP3
cat > /etc/dovecot/conf.d/20-pop3.conf << 'EOF'
protocol pop3 {
  mail_max_userip_connections = 10
  pop3_uidl_format = %08Xu%08Xv
}
EOF

# Configure Dovecot LMTP
cat > /etc/dovecot/conf.d/20-lmtp.conf << 'EOF'
protocol lmtp {
  postmaster_address = postmaster@aircrew.nl
  mail_plugins = $mail_plugins
}

service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    group = postfix
    mode = 0600
    user = postfix
  }
}
EOF

# Generate DH parameters
echo -e "\n${GREEN}🔐 Generating DH parameters...${NC}"
openssl dhparam -out /etc/dovecot/dh.pem 2048

# Configure DKIM
echo -e "\n${GREEN}🔑 Setting up DKIM...${NC}"
mkdir -p /etc/dkimkeys
cd /etc/dkimkeys
opendkim-genkey -s default -d aircrew.nl
chown opendkim:opendkim default.private
chmod 600 default.private

cat > /etc/opendkim.conf << 'EOF'
# DKIM Configuration for aircrew.nl
Syslog yes
SyslogSuccess yes
LogWhy yes
Canonicalization relaxed/simple
Mode sv
SubDomains yes
OversignHeaders From
AutoRestart yes
AutoRestartRate 10/1M
Background yes
DNSTimeout 5
SignatureAlgorithm rsa-sha256

# Key Configuration
Domain aircrew.nl
KeyFile /etc/dkimkeys/default.private
Selector default

# Socket Configuration
Socket inet:8891@localhost
PidFile /run/opendkim/opendkim.pid

# User/Group
UserID opendkim:opendkim
UMask 002

# Trusted Hosts
ExternalIgnoreList /etc/opendkim/trusted.hosts
InternalHosts /etc/opendkim/trusted.hosts
EOF

mkdir -p /etc/opendkim
echo "127.0.0.1
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
aircrew.nl
*.aircrew.nl" > /etc/opendkim/trusted.hosts

# Get SSL certificate
echo -e "\n${GREEN}🔒 Obtaining SSL certificate...${NC}"
certbot certonly --standalone -d mail.aircrew.nl --email $ADMIN_EMAIL --agree-tos --non-interactive

# Configure firewall
echo -e "\n${GREEN}🛡️ Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 25/tcp
ufw allow 53/tcp
ufw allow 80/tcp
ufw allow 110/tcp
ufw allow 143/tcp
ufw allow 443/tcp
ufw allow 465/tcp
ufw allow 587/tcp
ufw allow 993/tcp
ufw allow 995/tcp
ufw --force enable

# Configure Fail2ban
echo -e "\n${GREEN}🔨 Setting up Fail2ban...${NC}"
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[postfix]
enabled = true

[dovecot]
enabled = true

[postfix-sasl]
enabled = true
EOF

# Start services
echo -e "\n${GREEN}🚀 Starting services...${NC}"
systemctl enable postfix dovecot opendkim fail2ban
systemctl restart postfix dovecot opendkim fail2ban

# Create test email accounts
echo -e "\n${GREEN}📧 Creating email accounts...${NC}"
mysql -u mailuser -pSecureMailPass2024! mailserver << 'EOF'
INSERT INTO users (email, password) VALUES 
    ('noreply@aircrew.nl', ENCRYPT('NoreplySecure2024!', CONCAT('$6$', SUBSTRING(SHA(RAND()), -16)))),
    ('admin@aircrew.nl', ENCRYPT('AdminSecure2024!', CONCAT('$6$', SUBSTRING(SHA(RAND()), -16)))),
    ('support@aircrew.nl', ENCRYPT('SupportSecure2024!', CONCAT('$6$', SUBSTRING(SHA(RAND()), -16))));

INSERT INTO aliases (source, destination) VALUES 
    ('postmaster@aircrew.nl', 'admin@aircrew.nl'),
    ('abuse@aircrew.nl', 'admin@aircrew.nl'),
    ('hostmaster@aircrew.nl', 'admin@aircrew.nl');
EOF

echo -e "\n${GREEN}✅ Email server setup complete!${NC}"
echo -e "\n${YELLOW}📝 IMPORTANT: DNS Records to configure:${NC}"
echo -e "MX      @               10 mail.aircrew.nl."
echo -e "A       mail            136.144.175.93"
echo -e "A       smtp            136.144.175.93"
echo -e "A       imap            136.144.175.93"
echo -e "A       pop             136.144.175.93"

echo -e "\n${YELLOW}🔑 DKIM Public Key (add as TXT record):${NC}"
echo -e "default._domainkey IN TXT \""
cat /etc/dkimkeys/default.txt | grep -v "default._domainkey" | tr -d '\n\t " '
echo -e "\""

echo -e "\n${YELLOW}📧 Test Email Accounts Created:${NC}"
echo -e "noreply@aircrew.nl : NoreplySecure2024!"
echo -e "admin@aircrew.nl   : AdminSecure2024!"
echo -e "support@aircrew.nl : SupportSecure2024!"

echo -e "\n${YELLOW}🔧 Server Configuration:${NC}"
echo -e "SMTP Server: mail.aircrew.nl (Port 587 - STARTTLS, Port 465 - SSL/TLS)"
echo -e "IMAP Server: mail.aircrew.nl (Port 993 - SSL/TLS, Port 143 - STARTTLS)"
echo -e "POP3 Server: mail.aircrew.nl (Port 995 - SSL/TLS, Port 110 - STARTTLS)"

echo -e "\n${GREEN}🎉 Your professional email server is ready!${NC}"