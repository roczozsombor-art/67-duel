# 67 DUEL – Deployment útmutató

Ez a dokumentum lépésről lépésre leírja, hogyan kell a **backend**-et Railway-re, a **frontend**-et Vercel-re deploy-olni.

---

## Áttekintés

| Rész | Platform | URL |
|------|----------|-----|
| Backend (Node.js + Socket.IO) | [Railway](https://railway.app) | `https://<projekt>.up.railway.app` |
| Frontend (React + Vite) | [Vercel](https://vercel.com) | `https://<projekt>.vercel.app` |

---

## 1. Előkészítés – GitHub repo

Ha még nincs GitHub repo, hozz létre egyet és told fel a kódot:

```bash
# A projekt gyökérkönyvtárában:
git remote add origin https://github.com/<felhasználóneved>/67-duel.git
git push -u origin main
```

---

## 2. Backend deploy – Railway

### 2.1 Railway projekt létrehozása

1. Menj a [railway.app](https://railway.app) oldalra és jelentkezz be
2. Kattints a **"New Project"** gombra
3. Válaszd a **"Deploy from GitHub repo"** opciót
4. Válaszd ki a `67-duel` repót

### 2.2 Root directory beállítása

Railway az egész repót látja, de a backend a gyökérben fut — a `railway.toml` ezt már konfigurálja, szóval nincs extra teendő.

### 2.3 Környezeti változók beállítása

A Railway dashboardon a **"Variables"** fülön add hozzá:

| Változó | Érték | Leírás |
|---------|-------|--------|
| `PORT` | (automatic) | Railway automatikusan beállítja, nem kell megadni |
| `FRONTEND_URL` | `https://<vercel-projekt>.vercel.app` | A Vercel frontend URL-je (lásd 3. lépés) |

> ⚠️ A `FRONTEND_URL`-t a Vercel deploy után kell megadni, ha még nem tudod az URL-t. Deploy után visszajöhetsz és beállíthatod.

### 2.4 Deploy

A Railway automatikusan builel és deploy-ol, amint pusholsz a GitHub repóba. Az első deploy ~1-2 percet vesz igénybe.

Ellenőrzés: nyisd meg `https://<railway-url>/api/leaderboard` — ha `[]`-t kapsz vissza, működik.

---

## 3. Frontend deploy – Vercel

### 3.1 Vercel projekt létrehozása

1. Menj a [vercel.com](https://vercel.com) oldalra és jelentkezz be
2. Kattints az **"Add New → Project"** gombra
3. Importáld a `67-duel` GitHub repót
4. **Root Directory**: állítsd be `client`-re (fontos!)
5. **Framework Preset**: automatikusan felismeri Vite-ként

### 3.2 Környezeti változók beállítása

A **"Environment Variables"** szekcióban add hozzá:

| Változó | Érték |
|---------|-------|
| `VITE_SERVER_URL` | `https://<railway-projekt>.up.railway.app` |

> A Railway URL-t a Railway dashboardon találod a projekt neve alatt.

### 3.3 Deploy

Kattints a **"Deploy"** gombra. Vercel ~1 perc alatt builel és kirak egy URL-t.

---

## 4. CORS összekötés – utolsó lépés

Miután mindkét platform deploy-olt:

1. Másold ki a **Vercel URL**-t (pl. `https://67-duel.vercel.app`)
2. Menj a Railway dashboardra → **Variables**
3. Állítsd be: `FRONTEND_URL` = `https://67-duel.vercel.app`
4. Railway automatikusan újraindul

Ezután a frontend és backend tud egymással kommunikálni.

---

## 5. Ellenőrzés

```
✅ https://<railway-url>/api/leaderboard  →  JSON választ ad vissza
✅ https://<vercel-url>  →  betölti a 67 DUEL UI-t
✅ Kamera engedély kérés megjelenik
✅ Felhasználó regisztráció működik
✅ Matchmaking várólistára kerülés működik
```

---

## 6. Frissítések deploy-olása

```bash
# Bármilyen változtatás után:
git add .
git commit -m "update: leírás"
git push origin main
```

- **Railway** automatikusan újra deploy-ol
- **Vercel** automatikusan újra builel

---

## Hibaelhárítás

### "CORS error" a frontend konzolon
→ Ellenőrizd, hogy a Railway `FRONTEND_URL` változó pontosan a Vercel URL-t tartalmazza (trailing slash nélkül).

### Socket.IO nem csatlakozik
→ Ellenőrizd, hogy a Vercel `VITE_SERVER_URL` a Railway URL-re mutat, és a Railway szerver fut.

### "No camera" a Match oldalon
→ A böngésző csak HTTPS-en engedi a kamera hozzáférést. Mindkét platform automatikusan HTTPS-t ad, lokálisan `localhost`-on is működik.

### Adatok elvesznek Railway restart után
→ A JSON adatfájl (`server/data.json`) nem perzisztens Railway-en. Ha tartós adatmegőrzés kell, adj hozzá egy **Railway PostgreSQL** vagy **Railway Volume** plugint, és frissítsd a `server/db.js`-t ennek megfelelően.
