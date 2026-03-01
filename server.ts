import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("ecommerce.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    original_price REAL,
    image_url TEXT,
    category_id INTEGER,
    stock INTEGER DEFAULT 0,
    location TEXT,
    is_flash_sale INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    payment_method TEXT,
    customer_name TEXT,
    customer_surname TEXT,
    customer_location TEXT,
    customer_contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_admin_reply INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    discount_percent INTEGER NOT NULL,
    image_url TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('free_shipping', '0');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('return_policy', '7');
`);

// Populate Categories
const categoriesCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as any;
if (categoriesCount.count === 0) {
  const defaultCategories = [
    "second hand things",
    "vechels",
    "Mobile eccesories",
    "Hand made craft or things",
    "pc, computer",
    "Tv",
    "Gaming",
    "Music",
    "birthday part",
    "stationary",
    "Fashion and design",
    "bycaycal",
    "Fun and play"
  ];
  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  defaultCategories.forEach(cat => insertCategory.run(cat));
}

// Database Migrations (Ensure columns exist for older databases)
const tables = [
  { name: 'products', columns: ['location', 'is_flash_sale', 'original_price', 'stock'] },
  { name: 'orders', columns: ['total', 'status', 'customer_name', 'customer_surname', 'customer_location', 'customer_contact', 'payment_method', 'payment_status'] }
];

tables.forEach(table => {
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as any[];
  table.columns.forEach(col => {
    if (!columns.find(c => c.name === col)) {
      try {
        let defaultValue = "TEXT";
        if (col === 'is_flash_sale') defaultValue = "INTEGER DEFAULT 0";
        if (col === 'payment_status') defaultValue = "TEXT DEFAULT 'unpaid'";
        if (col === 'status') defaultValue = "TEXT DEFAULT 'pending'";
        if (col === 'total') defaultValue = "REAL DEFAULT 0";
        if (col === 'customer_name') defaultValue = "TEXT";
        if (col === 'stock') defaultValue = "INTEGER DEFAULT 0";
        
        db.prepare(`ALTER TABLE ${table.name} ADD COLUMN ${col} ${defaultValue}`).run();
      } catch (e) {
        console.error(`Failed to add column ${col} to ${table.name}`, e);
      }
    }
  });
});

// Seed initial data
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCategory = db.prepare("INSERT INTO categories (name, icon) VALUES (?, ?)");
  insertCategory.run("Electronics", "Smartphone");
  insertCategory.run("Fashion", "Shirt");
  insertCategory.run("Beauty", "Sparkles");
  insertCategory.run("Home", "Home");

  const insertProduct = db.prepare("INSERT INTO products (name, description, price, original_price, image_url, category_id, stock, is_flash_sale) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertProduct.run("Wireless Earbuds Pro", "High quality sound", 129, 320, "https://picsum.photos/seed/earbuds/400/400", 1, 5, 1);
  insertProduct.run("Centella Niacinamide Serum", "Skin brightening serum", 129, 320, "https://picsum.photos/seed/serum/400/400", 3, 7, 1);
  insertProduct.run("Alpha Arbutin Face Serum", "Dark spot correction", 280, 280, "https://picsum.photos/seed/serum2/400/400", 3, 3, 1);

  // Seed Offers
  const offerCount = db.prepare("SELECT COUNT(*) as count FROM offers").get() as { count: number };
  if (offerCount.count === 0) {
    db.prepare("INSERT INTO offers (title, discount_percent, image_url) VALUES (?, ?, ?)").run("Summer Sale", 50, "https://picsum.photos/seed/summer/800/400");
  }
}

// Ensure Admin exists with correct credentials (outside category check)
const adminCount = db.prepare("SELECT COUNT(*) as count FROM admins").get() as { count: number };
if (adminCount.count === 0) {
  db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)").run("Jitendraghartimagar", "jite123");
} else {
  // Always ensure the first admin has the requested credentials for this session
  db.prepare("UPDATE admins SET username = ?, password = ? WHERE id = (SELECT id FROM admins LIMIT 1)").run("Jitendraghartimagar", "jite123");
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Simple Admin Middleware
  const isAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader === "Bearer admin-token") {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Auth Route
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const admin = db.prepare("SELECT * FROM admins WHERE username = ? AND password = ?").get(username, password);
    if (admin) {
      res.json({ token: "admin-token", username: (admin as any).username });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Helper to broadcast notifications
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  const createNotification = (type: string, title: string, message: string) => {
    const info = db.prepare("INSERT INTO notifications (type, title, message) VALUES (?, ?, ?)").run(type, title, message);
    const notification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(info.lastInsertRowid);
    broadcast({ type: "NOTIFICATION_RECEIVED", payload: notification });
    return notification;
  };

  // API Routes
  app.get("/api/categories", (req, res) => {
    res.json(db.prepare("SELECT * FROM categories ORDER BY id ASC").all());
  });

  app.post("/api/admin/categories", isAdmin, (req, res) => {
    const { name } = req.body;
    const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/admin/categories/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/products", (req, res) => {
    res.json(db.prepare("SELECT * FROM products").all());
  });

  app.get("/api/orders", isAdmin, (req, res) => {
    res.json(db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all());
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all() as any[];
    const settingsObj = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json(settingsObj);
  });

  app.post("/api/admin/settings", isAdmin, (req, res) => {
    const { free_shipping, return_policy } = req.body;
    if (free_shipping !== undefined) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('free_shipping', ?)").run(free_shipping.toString());
    }
    if (return_policy !== undefined) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('return_policy', ?)").run(return_policy.toString());
    }
    res.json({ success: true });
  });

  app.get("/api/notifications", isAdmin, (req, res) => {
    res.json(db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50").all());
  });

  app.post("/api/notifications/read", isAdmin, (req, res) => {
    const { id } = req.body;
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Product Management (Admin Only)
  app.post("/api/admin/products", isAdmin, (req, res) => {
    const { name, description, price, original_price, image_url, category_id, stock, location, is_flash_sale } = req.body;
    const info = db.prepare(`
      INSERT INTO products (name, description, price, original_price, image_url, category_id, stock, location, is_flash_sale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, price, original_price || price, image_url, category_id, stock, location, is_flash_sale ? 1 : 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/admin/products/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, description, price, original_price, image_url, category_id, stock, location, is_flash_sale } = req.body;
    db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, original_price = ?, image_url = ?, category_id = ?, stock = ?, location = ?, is_flash_sale = ?
      WHERE id = ?
    `).run(name, description, price, original_price || price, image_url, category_id, stock, location, is_flash_sale ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete("/api/admin/products/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/admin/products/:id/sold", isAdmin, (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE products SET stock = 0 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Offers Management (Admin Only)
  app.get("/api/offers", (req, res) => {
    res.json(db.prepare("SELECT * FROM offers WHERE is_active = 1").all());
  });

  app.post("/api/admin/offers", isAdmin, (req, res) => {
    const { title, discount_percent, image_url } = req.body;
    const info = db.prepare("INSERT INTO offers (title, discount_percent, image_url) VALUES (?, ?, ?)").run(title, discount_percent, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/admin/offers/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    const { title, discount_percent, image_url } = req.body;
    db.prepare("UPDATE offers SET title = ?, discount_percent = ?, image_url = ? WHERE id = ?").run(title, discount_percent, image_url, id);
    res.json({ success: true });
  });

  app.delete("/api/admin/offers/:id", isAdmin, (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM offers WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Chat Management
  app.get("/api/admin/chats", isAdmin, (req, res) => {
    res.json(db.prepare("SELECT * FROM chats ORDER BY created_at DESC").all());
  });

  app.post("/api/chats", (req, res) => {
    const { customer_name, message } = req.body;
    const info = db.prepare("INSERT INTO chats (customer_name, message) VALUES (?, ?)").run(customer_name, message);
    createNotification("inquiry", "New Chat Message", `From ${customer_name}: ${message.substring(0, 30)}...`);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/admin/chats/reply", isAdmin, (req, res) => {
    const { customer_name, message } = req.body;
    db.prepare("INSERT INTO chats (customer_name, message, is_admin_reply) VALUES (?, ?, 1)").run(customer_name, message);
    res.json({ success: true });
  });

  app.post("/api/orders", (req, res) => {
    const { total, customer_name, customer_surname, customer_location, customer_contact, items, payment_method, card_details } = req.body;
    
    // If it's a card payment, we simulate a successful transaction
    const payment_status = payment_method === 'cod' ? 'unpaid' : 'paid';

    const info = db.prepare(`
      INSERT INTO orders (total, customer_name, customer_surname, customer_location, customer_contact, payment_method, payment_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(total, customer_name, customer_surname, customer_location, customer_contact, payment_method, payment_status);

    const orderId = info.lastInsertRowid;

    // Send notification to admin
    createNotification('order', 'New Order Received!', `Order #${orderId} from ${customer_name} for Rs. ${total}`);

    // Check for low inventory
    if (items && Array.isArray(items)) {
      items.forEach((item: any) => {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.id) as any;
        if (product) {
          const newStock = product.stock - item.quantity;
          db.prepare("UPDATE products SET stock = ? WHERE id = ?").run(newStock, item.id);
          if (newStock <= 2) {
            createNotification("inventory", "Low Stock Alert", `${product.name} is running low (${newStock} left)`);
          }
        }
      });
    }

    res.json({ id: orderId, status: 'success' });
  });

  // Payment Initiation (Khalti / eSewa)
  app.post("/api/payments/initiate", (req, res) => {
    const { amount, payment_method, customer_details, items } = req.body;
    
    // Create a pending order first
    const info = db.prepare(`
      INSERT INTO orders (total, customer_name, customer_surname, customer_location, customer_contact, payment_method, payment_status, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'unpaid', 'pending_payment')
    `).run(amount, customer_details.name, customer_details.surname, customer_details.location, customer_details.contact, payment_method);

    const orderId = info.lastInsertRowid;

    // Check for low inventory and deduct stock
    if (items && Array.isArray(items)) {
      items.forEach((item: any) => {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.id) as any;
        if (product) {
          const newStock = product.stock - item.quantity;
          db.prepare("UPDATE products SET stock = ? WHERE id = ?").run(newStock, item.id);
          if (newStock <= 2) {
            createNotification("inventory", "Low Stock Alert", `${product.name} is running low (${newStock} left)`);
          }
        }
      });
    }

    // In a real app, you would call Khalti/eSewa API here
    const success_url = `${process.env.APP_URL || 'http://localhost:3000'}/api/payments/verify?method=${payment_method}&order_id=${orderId}&amount=${amount}`;

    if (payment_method === 'khalti') {
      // Mock Khalti Redirect
      res.json({ 
        payment_url: success_url,
        message: "Redirecting to Khalti..." 
      });
    } else if (payment_method === 'esewa') {
      // Mock eSewa Redirect
      res.json({ 
        payment_url: success_url,
        message: "Redirecting to eSewa..." 
      });
    } else {
      res.status(400).json({ error: "Invalid payment method" });
    }
  });

  // Payment Verification Callback
  app.get("/api/payments/verify", (req, res) => {
    const { method, order_id, amount } = req.query;

    // Update the existing order
    db.prepare(`
      UPDATE orders 
      SET payment_status = 'paid', status = 'pending'
      WHERE id = ?
    `).run(order_id);

    // Send notification
    createNotification('order', 'Payment Successful!', `Order #${order_id} paid via ${method} for Rs. ${amount}`);

    // Redirect back to the app with a success message
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; margin: 0;">
          <div style="background: white; padding: 40px; border-radius: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%;">
            <div style="width: 80px; height: 80px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 40px;">✓</div>
            <h1 style="margin: 0 0 12px; color: #0f172a; font-weight: 900;">Payment Done!</h1>
            <p style="color: #64748b; margin-bottom: 32px; line-height: 1.6;">Your order <b>#${order_id}</b> has been placed successfully via <b>${method}</b>. We will contact you soon!</p>
            <a href="/" style="display: block; background: #0f172a; color: white; padding: 16px; border-radius: 16px; text-decoration: none; font-weight: 900; letter-spacing: 0.5px;">BACK TO STORE</a>
          </div>
        </body>
      </html>
    `);
  });

  app.post("/api/inquiries", (req, res) => {
    const { name, message } = req.body;
    createNotification("inquiry", "New Customer Inquiry", `From ${name}: ${message.substring(0, 50)}...`);
    res.json({ success: true });
  });

  app.patch("/api/orders/:id/status", isAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
    createNotification("shipping", "Shipping Update", `Order #${id} status changed to ${status}`);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
