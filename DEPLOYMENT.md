# Deployment Guide

This guide will help you deploy your fashion website to production.

## Quick Start

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider

3. **Update configuration files** with your actual domain

## Platform-Specific Guides

### Vercel (Recommended)

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   Or connect your GitHub repository on [vercel.com](https://vercel.com)

3. **Configure**:
   - Vercel automatically detects Vite projects
   - Add environment variables in Vercel dashboard
   - Custom domain can be added in project settings

### Netlify

1. **Option 1: Drag and Drop**
   - Build: `npm run build`
   - Drag the `dist` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

2. **Option 2: Git Integration**
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Configure**:
   - Add environment variables in Site settings
   - Add custom domain in Domain settings

### AWS S3 + CloudFront

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

2. **Upload files**:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. **Configure S3 for static hosting**:
   - Enable static website hosting
   - Set index document to `index.html`
   - Set error document to `index.html` (for SPA routing)

4. **Create CloudFront distribution**:
   - Origin: Your S3 bucket
   - Default root object: `index.html`
   - Enable HTTPS

### GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add script to package.json**:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Configure**:
   - Go to repository Settings > Pages
   - Select source branch: `gh-pages`
   - Add custom domain if needed

## Pre-Deployment Checklist

### 1. Update Configuration Files

- [ ] **index.html**: Update meta tags with your domain
  - Replace `https://yourdomain.com` with your actual domain
  - Update Open Graph image URL
  - Update canonical URL

- [ ] **robots.txt**: Update sitemap URL
  ```txt
  Sitemap: https://yourdomain.com/sitemap.xml
  ```

- [ ] **sitemap.xml**: Update all URLs
  - Replace `https://yourdomain.com` with your actual domain
  - Update `lastmod` dates

### 2. Environment Variables

Create `.env.production` or configure in your hosting platform:

```env
VITE_SITE_URL=https://yourdomain.com
VITE_SITE_NAME=Fashion Trends
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Test Production Build

```bash
npm run build
npm run preview
```

Test thoroughly:
- [ ] All pages load correctly
- [ ] External links work
- [ ] Images load properly
- [ ] Responsive design works
- [ ] No console errors

### 4. Performance Check

- [ ] Run Lighthouse audit
- [ ] Check bundle sizes
- [ ] Verify images are optimized
- [ ] Test loading speed

### 5. SEO Verification

- [ ] Google Search Console setup
- [ ] Submit sitemap
- [ ] Verify meta tags
- [ ] Test social sharing previews

### 6. Analytics Setup

- [ ] Google Analytics configured
- [ ] Verify tracking works
- [ ] Set up conversion goals
- [ ] Configure event tracking

## Post-Deployment

### 1. Monitor

- Set up error monitoring (Sentry, LogRocket)
- Monitor analytics
- Check server logs
- Monitor performance

### 2. SSL Certificate

- Ensure HTTPS is enabled
- Verify certificate is valid
- Set up automatic renewal

### 3. CDN Configuration

- Configure caching headers
- Set up CDN rules
- Optimize asset delivery

### 4. Backup Strategy

- Regular backups of configuration
- Version control for code
- Database backups (if applicable)

## Troubleshooting

### Build Fails

- Check Node.js version (18+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors
- Verify all dependencies are installed

### Build Succeeds but Site Doesn't Load

- Check hosting configuration
- Verify `dist` folder is uploaded correctly
- Check for routing issues (SPA configuration)
- Verify index.html is in root

### Images Not Loading

- Check image paths (relative vs absolute)
- Verify images are in `dist` folder
- Check CORS settings
- Verify image URLs are correct

### External Links Not Working

- Verify URLs are correct
- Check for HTTPS issues
- Verify `rel="noopener noreferrer"` is present
- Test links manually

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Support

For deployment issues, check:
- Hosting provider documentation
- Vite deployment guide
- React deployment guide

