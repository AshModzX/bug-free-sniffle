# JuttiDot Shop

Traditional Kolhapuri & Jutti footwear store — Kathmandu, Nepal.

## Quick Start

```bash
npm install
npm start
```

Then open http://localhost:3000

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port to listen on |
| `ADMIN_PASSWORD` | `admin123` | Password for the admin panel |

Set them before starting:
```bash
ADMIN_PASSWORD=mysecretpassword PORT=8080 npm start
```

## Adding product images

Place product images in the `public/uploads/image/` folder.
They are referenced in `data.json` as `/uploads/image/filename.jpg`.

## Admin Panel

Visit `/admin.html` and log in with your `ADMIN_PASSWORD`.
From there you can add/edit/delete items, categories, and upload product photos.

## File structure

```
server.js        ← Express server (Node.js, no build step needed)
package.json     ← Dependencies
data.json        ← Shop data (categories + items)
public/
  index.html     ← Homepage
  products.html  ← Product grid with image slider
  about.html     ← About page
  contact.html   ← Contact form
  admin.html     ← Admin panel
  css/style.css
  js/main.js
  uploads/       ← Uploaded & product images
```
