# Deploying 13thoni.com

The site is designed for GitHub-connected Cloudflare Pages hosting. Squarespace remains the domain registrar; it does not host the website.

## 1. Put the site on GitHub

Create a repository named `13thoni-site`, commit this project, and push the `main` branch. Do not commit account credentials or API tokens.

## 2. Create the Cloudflare Pages project

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Choose **Create** → **Pages** → **Connect to Git**.
3. Connect GitHub and select `13thoni-site`.
4. Set the production branch to `main`.
5. Use the framework/build settings required by this repository.
6. Deploy and verify the generated `*.pages.dev` address before changing the domain.

## 3. Copy existing Squarespace DNS records

Before changing nameservers, open the DNS settings for `13thoni.com` in Squarespace and record every existing DNS entry. Preserve all MX records and every email-related SPF, DKIM, and DMARC TXT/CNAME record. Preserve verification records and active subdomains. If DNSSEC is enabled, disable it before switching nameservers.

## 4. Add 13thoni.com to Cloudflare DNS

1. In Cloudflare, choose **Add a domain** and enter `13thoni.com`.
2. The Free plan is sufficient for this site.
3. Let Cloudflare scan the current DNS records.
4. Compare the imported list against the Squarespace list and recreate anything missing.
5. Cloudflare will provide two authoritative nameservers. Copy both exactly.

## 5. Change nameservers at Squarespace

1. Open **Squarespace Domains** and select `13thoni.com`.
2. Open **DNS** → **Domain Nameservers**.
3. Select **Use Custom Nameservers**.
4. Enter the two nameservers assigned by Cloudflare and save.
5. Do not cancel or transfer the domain. Squarespace continues handling registration and renewal.

Wait until Cloudflare reports the zone as active. Then verify that any custom email still sends and receives correctly.

## 6. Connect the domain to Pages

1. Open the Pages project in Cloudflare.
2. Select **Custom domains** → **Set up a domain**.
3. Add `13thoni.com` and allow Cloudflare to create its DNS record.
4. Add `www.13thoni.com` as a second custom domain.
5. Create a permanent redirect from `www.13thoni.com/*` to `https://13thoni.com/$1` using Cloudflare Redirect Rules.
6. Verify HTTPS on both addresses and confirm that `www` redirects to the apex domain.

After the site, DNS, HTTPS, and email are stable, re-enable DNSSEC through Cloudflare and follow Cloudflare's instructions for the required DS record at Squarespace.

## Safety checkpoint

Never change nameservers until the Pages deployment works and Cloudflare contains a complete copy of every DNS record that matters. Never delete email DNS records, cancel the Squarespace registration, or publish secrets in GitHub.
