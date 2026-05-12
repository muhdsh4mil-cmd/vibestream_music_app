import os
import sys
import json
import time
import threading
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox
import urllib.request
import urllib.error

# Spotify-Style Colors & Tokens
API_BASE = "http://localhost:3000/api/admin"
APP_BG = "#08070c"        # Canvas backdrop
SIDEBAR_BG = "#030205"    # Sidebar surface
CARD_BG = "#110f1a"       # Solid surface cards
ACCENT_GREEN = "#1db954"  # Spotify Brand Green
ACCENT_PURPLE = "#a855f7" # Vibrant purple highlight
ACCENT_PINK = "#ff2a5f"   # Coral pink warnings & alerts
TEXT_PRIMARY = "#ffffff"  # Pure White
TEXT_SECONDARY = "#a1a1aa"# Soft Cool Gray
BORDER_COLOR = "#1d192f"  # Card and separator borders

class AdminPortalApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Melody Admin Portal")
        self.root.geometry("1100x700")
        self.root.configure(bg=APP_BG)
        self.root.minsize(1000, 620)
        
        # Center Window on Screen
        self.center_window()

        # Session State variables
        self.admin_token = None
        self.admin_username = None
        self.refresh_thread_active = False
        self.metrics_interval = 3.0 # refresh metrics every 3 seconds
        self.active_tab = "dashboard" # Current active view tab

        # Configure custom style system
        self.setup_styles()

        # Initialize Main Canvas Wrapper
        self.canvas_container = tk.Frame(self.root, bg=APP_BG)
        self.canvas_container.pack(fill=tk.BOTH, expand=True)

        # Show Login View Initially
        self.show_login_view()

    def center_window(self):
        self.root.update_idletasks()
        width = 1100
        height = 700
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f"{width}x{height}+{x}+{y}")

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use("clam")

        # Global Frame Styling
        style.configure("TFrame", background=APP_BG)
        style.configure("Card.TFrame", background=CARD_BG, borderwidth=1, relief="solid", bordercolor=BORDER_COLOR)

        # Custom Labels
        style.configure("Title.TLabel", background=APP_BG, foreground=TEXT_PRIMARY, font=("Segoe UI", 24, "bold"))
        style.configure("Subtitle.TLabel", background=APP_BG, foreground=TEXT_SECONDARY, font=("Segoe UI", 11))
        
        style.configure("CardHeader.TLabel", background=CARD_BG, foreground=TEXT_SECONDARY, font=("Segoe UI", 10, "bold"))
        style.configure("CardValue.TLabel", background=CARD_BG, foreground=TEXT_PRIMARY, font=("Segoe UI", 22, "bold"))

        # Treeview Styles (Premium Dark Theme Table)
        style.configure("Treeview", 
                        background=CARD_BG, 
                        foreground=TEXT_PRIMARY, 
                        fieldbackground=CARD_BG,
                        rowheight=38,
                        borderwidth=0,
                        font=("Segoe UI", 10))
        
        style.map("Treeview", 
                  background=[("selected", ACCENT_PURPLE)],
                  foreground=[("selected", "#ffffff")])

        # Modern Borderless Headers
        style.configure("Treeview.Heading", 
                        background=BORDER_COLOR, 
                        foreground=TEXT_PRIMARY, 
                        font=("Segoe UI", 10, "bold"),
                        borderwidth=0,
                        relief="flat",
                        padding=12)
        
        style.map("Treeview.Heading",
                  background=[("active", BORDER_COLOR)],
                  foreground=[("active", TEXT_PRIMARY)])

        # Remove outer Treeview border lines
        style.layout("Treeview", [('Treeview.treearea', {'sticky': 'nswe'})])

    def clear_container(self):
        for widget in self.canvas_container.winfo_children():
            widget.destroy()

    def create_hover_button(self, parent, text, bg, fg, hover_bg, command, font=("Segoe UI", 10, "bold"), padx=15, pady=8, anchor=tk.CENTER):
        btn = tk.Button(parent, text=text, bg=bg, fg=fg, activebackground=hover_bg, activeforeground=fg, relief="flat", cursor="hand2", font=font, padx=padx, pady=pady, command=command, bd=0, anchor=anchor)
        btn.bind("<Enter>", lambda e: btn.config(bg=hover_bg))
        btn.bind("<Leave>", lambda e: btn.config(bg=bg))
        return btn

    def show_login_view(self):
        self.clear_container()

        # Center layout wrapper
        login_frame = tk.Frame(self.canvas_container, bg=APP_BG)
        login_frame.place(relx=0.5, rely=0.5, anchor=tk.CENTER)

        # Decorative Brand Icon Frame
        brand_frame = tk.Frame(login_frame, bg=APP_BG)
        brand_frame.pack(pady=(0, 20))
        
        logo_lbl = tk.Label(brand_frame, text="🎵", font=("Segoe UI", 56), bg=APP_BG, fg=ACCENT_GREEN)
        logo_lbl.pack()

        # Title Block
        title_lbl = tk.Label(login_frame, text="Vibestream Admin Portal", font=("Segoe UI", 24, "bold"), bg=APP_BG, fg=TEXT_PRIMARY)
        title_lbl.pack()
        
        subtitle_lbl = tk.Label(login_frame, text="Secure Administrative Access Gateway", font=("Segoe UI", 10), bg=APP_BG, fg=TEXT_SECONDARY)
        subtitle_lbl.pack(pady=(2, 30))

        # Login Form Card (Premium glassy feel)
        form_card = tk.Frame(login_frame, bg=CARD_BG, highlightbackground=BORDER_COLOR, highlightthickness=1, bd=0)
        form_card.pack(ipadx=35, ipady=35)

        # Input elements
        tk.Label(form_card, text="ADMIN USERNAME", font=("Segoe UI", 9, "bold"), bg=CARD_BG, fg=TEXT_SECONDARY).pack(anchor=tk.W, padx=15, pady=(15, 6))
        self.username_entry = tk.Entry(form_card, font=("Segoe UI", 11), bg=APP_BG, fg=TEXT_PRIMARY, insertbackground="#fff", bd=1, relief="solid", highlightcolor=ACCENT_GREEN, highlightbackground=BORDER_COLOR, highlightthickness=1)
        self.username_entry.pack(fill=tk.X, padx=15, ipady=10, pady=(0, 18))
        self.username_entry.focus()

        tk.Label(form_card, text="ADMIN PASSWORD", font=("Segoe UI", 9, "bold"), bg=CARD_BG, fg=TEXT_SECONDARY).pack(anchor=tk.W, padx=15, pady=(0, 6))
        self.password_entry = tk.Entry(form_card, show="*", font=("Segoe UI", 11), bg=APP_BG, fg=TEXT_PRIMARY, insertbackground="#fff", bd=1, relief="solid", highlightcolor=ACCENT_GREEN, highlightbackground=BORDER_COLOR, highlightthickness=1)
        self.password_entry.pack(fill=tk.X, padx=15, ipady=10, pady=(0, 22))
        self.password_entry.bind("<Return>", lambda e: self.perform_login())

        # Error text element
        self.login_error_lbl = tk.Label(form_card, text="", font=("Segoe UI", 9, "bold"), bg=CARD_BG, fg=ACCENT_PINK)
        self.login_error_lbl.pack(pady=(0, 12))

        # Login Action button
        login_btn = self.create_hover_button(
            form_card, 
            text="Authenticate Credentials", 
            bg=ACCENT_GREEN, 
            fg="#ffffff", 
            hover_bg="#1ed760", 
            command=self.perform_login,
            font=("Segoe UI", 11, "bold"),
            pady=12
        )
        login_btn.pack(fill=tk.X, padx=15)

    def perform_login(self):
        username = self.username_entry.get().strip()
        password = self.password_entry.get()

        if not username or not password:
            self.login_error_lbl.config(text="⚠️ Credentials must not be empty.")
            return

        self.login_error_lbl.config(text="Connecting to Security Node...")
        self.root.update()

        # Build request to REST API
        login_url = f"{API_BASE}/login"
        payload = json.dumps({"username": username, "password": password}).encode("utf-8")
        req = urllib.request.Request(
            login_url,
            data=payload,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                if res_data.get("success"):
                    self.admin_token = res_data.get("token")
                    self.admin_username = res_data.get("username")
                    self.show_dashboard_view()
                else:
                    self.login_error_lbl.config(text="⚠️ Access Denied.")
        except urllib.error.HTTPError as e:
            if e.code == 401:
                self.login_error_lbl.config(text="❌ Invalid credentials.")
            else:
                self.login_error_lbl.config(text=f"❌ Network issue. Code: {e.code}")
        except urllib.error.URLError:
            self.login_error_lbl.config(text="❌ Server offline. Start local server (npm run dev).")
        except Exception as e:
            self.login_error_lbl.config(text=f"❌ Exception: {str(e)}")

    def show_dashboard_view(self):
        self.clear_container()

        # --- SIDEBAR PANELS (Left side Navigation) ---
        self.sidebar = tk.Frame(self.canvas_container, bg=SIDEBAR_BG, width=240)
        self.sidebar.pack(side=tk.LEFT, fill=tk.Y)
        self.sidebar.pack_propagate(False)

        # Branding Header
        brand_wrapper = tk.Frame(self.sidebar, bg=SIDEBAR_BG, pady=25, padx=20)
        brand_wrapper.pack(fill=tk.X)

        brand_lbl = tk.Label(brand_wrapper, text="🎵 MELODY SYSTEM", font=("Segoe UI", 14, "bold"), bg=SIDEBAR_BG, fg=TEXT_PRIMARY)
        brand_lbl.pack(anchor=tk.W)
        
        admin_badge = tk.Label(brand_wrapper, text="🛡️ Authorized Admin", font=("Segoe UI", 9, "bold"), bg=SIDEBAR_BG, fg=ACCENT_GREEN)
        admin_badge.pack(anchor=tk.W, pady=(4, 0))

        # Menu tab wrapper
        menu_frame = tk.Frame(self.sidebar, bg=SIDEBAR_BG, padx=0, pady=10)
        menu_frame.pack(fill=tk.BOTH, expand=True)

        # 1. Dashboard Tab Button with Accent Indicator Stripe
        self.dash_btn_frame = tk.Frame(menu_frame, bg=SIDEBAR_BG)
        self.dash_btn_frame.pack(fill=tk.X, pady=2)
        
        self.dash_indicator = tk.Frame(self.dash_btn_frame, bg=ACCENT_GREEN, width=4)
        self.dash_indicator.pack(side=tk.LEFT, fill=tk.Y)
        
        self.tab_dashboard_btn = tk.Button(
            self.dash_btn_frame, text="  📊  System Dashboard", 
            bg=BORDER_COLOR, fg=TEXT_PRIMARY, activebackground=BORDER_COLOR, activeforeground=TEXT_PRIMARY,
            relief="flat", cursor="hand2", font=("Segoe UI", 10, "bold"), anchor=tk.W, padx=15, pady=12, bd=0
        )
        self.tab_dashboard_btn.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # 2. Users Tab Button with Accent Indicator Stripe
        self.users_btn_frame = tk.Frame(menu_frame, bg=SIDEBAR_BG)
        self.users_btn_frame.pack(fill=tk.X, pady=2)
        
        self.users_indicator = tk.Frame(self.users_btn_frame, bg=SIDEBAR_BG, width=4)
        self.users_indicator.pack(side=tk.LEFT, fill=tk.Y)
        
        self.tab_users_btn = tk.Button(
            self.users_btn_frame, text="  👥  User Databases", 
            bg=SIDEBAR_BG, fg=TEXT_SECONDARY, activebackground=BORDER_COLOR, activeforeground=TEXT_PRIMARY,
            relief="flat", cursor="hand2", font=("Segoe UI", 10, "bold"), anchor=tk.W, padx=15, pady=12, bd=0
        )
        self.tab_users_btn.pack(side=tk.LEFT, fill=tk.X, expand=True)

        # Tab Hover Interactions (Mimicking visual focus)
        def on_dash_enter(e):
            if self.active_tab != "dashboard":
                self.tab_dashboard_btn.config(bg=BORDER_COLOR, fg=TEXT_PRIMARY)
        def on_dash_leave(e):
            if self.active_tab != "dashboard":
                self.tab_dashboard_btn.config(bg=SIDEBAR_BG, fg=TEXT_SECONDARY)
                
        self.tab_dashboard_btn.bind("<Enter>", on_dash_enter)
        self.tab_dashboard_btn.bind("<Leave>", on_dash_leave)
        self.tab_dashboard_btn.config(command=lambda: self.switch_view_tab("dashboard"))

        def on_users_enter(e):
            if self.active_tab != "users":
                self.tab_users_btn.config(bg=BORDER_COLOR, fg=TEXT_PRIMARY)
        def on_users_leave(e):
            if self.active_tab != "users":
                self.tab_users_btn.config(bg=SIDEBAR_BG, fg=TEXT_SECONDARY)
                
        self.tab_users_btn.bind("<Enter>", on_users_enter)
        self.tab_users_btn.bind("<Leave>", on_users_leave)
        self.tab_users_btn.config(command=lambda: self.switch_view_tab("users"))

        # Footer inside Sidebar
        footer_frame = tk.Frame(self.sidebar, bg=SIDEBAR_BG, pady=20, padx=15)
        footer_frame.pack(fill=tk.X, side=tk.BOTTOM)

        logout_btn = self.create_hover_button(
            footer_frame, "🔒  Logout Session", 
            bg="#ef4444", fg="#ffffff", hover_bg="#dc2626", 
            command=self.perform_logout,
            font=("Segoe UI", 10, "bold"), pady=10
        )
        logout_btn.pack(fill=tk.X)

        # --- RIGHT CONTENT CANVAS ---
        self.content_canvas = tk.Frame(self.canvas_container, bg=APP_BG)
        self.content_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=25, pady=20)

        # Top Control Area (Displays current view name & active administrator)
        self.header_bar = tk.Frame(self.content_canvas, bg=APP_BG, pady=10)
        self.header_bar.pack(fill=tk.X, pady=(0, 15))

        self.header_title = tk.Label(self.header_bar, text="Diagnostics Overview", font=("Segoe UI", 20, "bold"), bg=APP_BG, fg=TEXT_PRIMARY)
        self.header_title.pack(side=tk.LEFT)

        admin_pill = tk.Frame(self.header_bar, bg=CARD_BG, highlightbackground=BORDER_COLOR, highlightthickness=1, padx=12, pady=6)
        admin_pill.pack(side=tk.RIGHT)
        
        tk.Label(admin_pill, text=f"👤 {self.admin_username}", font=("Segoe UI", 10, "bold"), bg=CARD_BG, fg=ACCENT_GREEN).pack()

        # Initialize View Frames
        self.init_dashboard_panel()
        self.init_users_panel()

        # Render Active Tab Layout initially
        self.switch_view_tab("dashboard")

        # Launch background metrics loop thread
        self.refresh_thread_active = True
        self.refresh_thread = threading.Thread(target=self.metrics_loop, daemon=True)
        self.refresh_thread.start()

        # Fetch initial user information
        self.refresh_users_list()

    def init_dashboard_panel(self):
        self.dashboard_panel = tk.Frame(self.content_canvas, bg=APP_BG)

        # KPI GRID FRAME
        kpi_grid = tk.Frame(self.dashboard_panel, bg=APP_BG)
        kpi_grid.pack(fill=tk.X, pady=(0, 25))
        kpi_grid.grid_columnconfigure((0, 1, 2, 3), weight=1, uniform="equal")

        # Metrics string variables
        self.active_sessions_var = tk.StringVar(value="--")
        self.uptime_var = tk.StringVar(value="--")
        self.registered_users_var = tk.StringVar(value="--")
        self.memory_var = tk.StringVar(value="--")

        self.create_kpi_card(kpi_grid, 0, "ACTIVE SESSIONS", self.active_sessions_var, ACCENT_PURPLE)
        self.create_kpi_card(kpi_grid, 1, "SERVER UPTIME", self.uptime_var, ACCENT_PINK)
        self.create_kpi_card(kpi_grid, 2, "REGISTERED USERS", self.registered_users_var, ACCENT_GREEN)
        self.create_kpi_card(kpi_grid, 3, "PROCESS MEMORY", self.memory_var, TEXT_PRIMARY)

        # System Diagnostics Details
        details_card = tk.Frame(self.dashboard_panel, bg=CARD_BG, highlightbackground=BORDER_COLOR, highlightthickness=1, padx=25, pady=25)
        details_card.pack(fill=tk.BOTH, expand=True)

        tk.Label(details_card, text="⚙️  Core Environment Specifications", font=("Segoe UI", 13, "bold"), bg=CARD_BG, fg=TEXT_PRIMARY).pack(anchor=tk.W, pady=(0, 12))

        # Create row specs
        self.node_ver_var = tk.StringVar(value="Loading...")
        self.platform_var = tk.StringVar(value="Loading...")
        self.api_mode_var = tk.StringVar(value="Loading...")

        self.create_spec_row(details_card, "Runtime Engine Node.js Version:", self.node_ver_var)
        self.create_spec_row(details_card, "Host Operating System Platform:", self.platform_var)
        self.create_spec_row(details_card, "YouTube Dynamic Retrieval Mode:", self.api_mode_var)

    def init_users_panel(self):
        self.users_panel = tk.Frame(self.content_canvas, bg=APP_BG)

        # Controls Bar
        controls_bar = tk.Frame(self.users_panel, bg=APP_BG, pady=10)
        controls_bar.pack(fill=tk.X, pady=(0, 15))

        tk.Label(controls_bar, text="Auditing user registry indices inside database system file.", font=("Segoe UI", 10), bg=APP_BG, fg=TEXT_SECONDARY).pack(side=tk.LEFT)

        # Right Actions
        btn_wrapper = tk.Frame(controls_bar, bg=APP_BG)
        btn_wrapper.pack(side=tk.RIGHT)

        refresh_btn = self.create_hover_button(
            btn_wrapper, "🔄  Sync Database", 
            bg=CARD_BG, fg=TEXT_PRIMARY, hover_bg=BORDER_COLOR, 
            command=self.refresh_users_list,
            font=("Segoe UI", 9, "bold"), padx=12, pady=6
        )
        refresh_btn.pack(side=tk.LEFT, padx=(0, 10))

        delete_btn = self.create_hover_button(
            btn_wrapper, "🗑️  Delete Selected Account", 
            bg="#dc2626", fg="#ffffff", hover_bg="#ef4444", 
            command=self.delete_selected_user,
            font=("Segoe UI", 9, "bold"), padx=12, pady=6
        )
        delete_btn.pack(side=tk.LEFT)

        # Table Wrapper Frame (with thin border and no inner cell outlines)
        table_container = tk.Frame(self.users_panel, bg=CARD_BG, highlightbackground=BORDER_COLOR, highlightthickness=1)
        table_container.pack(fill=tk.BOTH, expand=True)

        table_scroll = ttk.Scrollbar(table_container)
        table_scroll.pack(side=tk.RIGHT, fill=tk.Y)

        self.tree = ttk.Treeview(table_container, columns=("fullName", "email", "password", "createdAt"), show="headings", yscrollcommand=table_scroll.set)
        table_scroll.config(command=self.tree.yview)

        # Alternating Row Tags Configuration (Zebra striping)
        self.tree.tag_configure("oddrow", background=CARD_BG)
        self.tree.tag_configure("evenrow", background="#181526")

        # Format Columns
        self.tree.heading("fullName", text="User Full Name")
        self.tree.heading("email", text="Email Address Reference")
        self.tree.heading("password", text="Audit Trace Password")
        self.tree.heading("createdAt", text="Signup Registration Timestamp")

        self.tree.column("fullName", width=220, anchor=tk.W)
        self.tree.column("email", width=260, anchor=tk.W)
        self.tree.column("password", width=180, anchor=tk.W)
        self.tree.column("createdAt", width=220, anchor=tk.W)

        self.tree.pack(fill=tk.BOTH, expand=True, padx=1, pady=1)

    def create_kpi_card(self, parent, col, title, string_var, val_color):
        card = tk.Frame(parent, bg=CARD_BG, highlightbackground=BORDER_COLOR, highlightthickness=1)
        card.grid(row=0, column=col, sticky="nsew", padx=6)

        lbl_title = tk.Label(card, text=title, font=("Segoe UI", 9, "bold"), bg=CARD_BG, fg=TEXT_SECONDARY)
        lbl_title.pack(anchor=tk.W, padx=15, pady=(15, 2))

        lbl_val = tk.Label(card, textvariable=string_var, font=("Segoe UI", 21, "bold"), bg=CARD_BG, fg=val_color)
        lbl_val.pack(anchor=tk.W, padx=15, pady=(0, 15))

    def create_spec_row(self, parent, title, string_var):
        row = tk.Frame(parent, bg=CARD_BG, pady=12)
        row.pack(fill=tk.X)

        lbl_t = tk.Label(row, text=title, font=("Segoe UI", 10), bg=CARD_BG, fg=TEXT_SECONDARY)
        lbl_t.pack(side=tk.LEFT)

        lbl_v = tk.Label(row, textvariable=string_var, font=("Segoe UI", 10, "bold"), bg=CARD_BG, fg=TEXT_PRIMARY)
        lbl_v.pack(side=tk.RIGHT)

        divider = tk.Frame(parent, bg=BORDER_COLOR, height=1)
        divider.pack(fill=tk.X)

    def switch_view_tab(self, tab_name):
        self.active_tab = tab_name

        if tab_name == "dashboard":
            # Highlight tabs in Sidebar and Indicator stripes
            self.dash_indicator.config(bg=ACCENT_GREEN)
            self.tab_dashboard_btn.config(bg=BORDER_COLOR, fg=TEXT_PRIMARY)
            
            self.users_indicator.config(bg=SIDEBAR_BG)
            self.tab_users_btn.config(bg=SIDEBAR_BG, fg=TEXT_SECONDARY)
            
            # Switch views
            self.users_panel.pack_forget()
            self.dashboard_panel.pack(fill=tk.BOTH, expand=True)
            self.header_title.config(text="Diagnostics Overview")
        else:
            # Highlight tabs in Sidebar and Indicator stripes
            self.users_indicator.config(bg=ACCENT_GREEN)
            self.tab_users_btn.config(bg=BORDER_COLOR, fg=TEXT_PRIMARY)
            
            self.dash_indicator.config(bg=SIDEBAR_BG)
            self.tab_dashboard_btn.config(bg=SIDEBAR_BG, fg=TEXT_SECONDARY)
            
            # Switch views
            self.dashboard_panel.pack_forget()
            self.users_panel.pack(fill=tk.BOTH, expand=True)
            self.header_title.config(text="Security Accounts Auditing")

    def fetch_api(self, endpoint, method="GET", payload=None):
        url = f"{API_BASE}/{endpoint}"
        req = urllib.request.Request(
            url,
            method=method,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        if payload:
            req.data = json.dumps(payload).encode("utf-8")
            req.add_header("Content-Type", "application/json")

        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                return json.loads(response.read().decode("utf-8")), None
        except urllib.error.HTTPError as e:
            if e.code == 401:
                # Session Expired
                self.root.after(0, self.handle_session_expired)
                return None, "Session Expired"
            try:
                err_data = json.loads(e.read().decode("utf-8"))
                return None, err_data.get("error", f"HTTP Error {e.code}")
            except:
                return None, f"HTTP Error {e.code}"
        except Exception as e:
            return None, str(e)

    def handle_session_expired(self):
        self.perform_logout()
        messagebox.showwarning("Session Expired", "Your administrative session has expired or is invalid. Please log in again.")

    def metrics_loop(self):
        """Threaded worker that gathers live metrics periodically while dashboard is open."""
        while self.refresh_thread_active:
            metrics, err = self.fetch_api("metrics")
            if metrics:
                # Format Server Uptime beautifully
                uptime_sec = metrics.get("serverUptime", 0)
                h = uptime_sec // 3600
                m = (uptime_sec % 3600) // 60
                s = uptime_sec % 60
                uptime_str = f"{h:d}h {m:d}m {s:d}s"

                # Update StringVars safely on Main Thread using root.after
                self.root.after(0, lambda m=metrics, ut=uptime_str: self.update_kpi_ui(m, ut))
            
            time.sleep(self.metrics_interval)

    def update_kpi_ui(self, m, uptime_str):
        self.active_sessions_var.set(str(m.get("activeSessionCount", "--")))
        self.uptime_var.set(uptime_str)
        self.registered_users_var.set(str(m.get("totalUsersCount", "--")))
        self.memory_var.set(f"{m.get('memoryUsageMB', '--')} MB")

        # Also update detailed spec rows in environment panel
        self.node_ver_var.set(m.get("nodeVersion", "N/A"))
        self.platform_var.set(m.get("platform", "N/A").capitalize())
        self.api_mode_var.set(m.get("apiMode", "N/A"))

    def refresh_users_list(self):
        users, err = self.fetch_api("users")
        if err:
            return

        # Clear existing rows in table
        for item in self.tree.get_children():
            self.tree.delete(item)

        # Add updated user entries with alternating colors (zebra striping)
        for i, user in enumerate(users):
            date_str = user.get("createdAt", "N/A")
            try:
                # Resolve ISO String or float timestamp parsing dynamically
                if isinstance(date_str, str) and 'T' in date_str:
                    date_str = date_str.replace('T', ' ').split('.')[0]
                elif isinstance(date_str, (int, float)):
                    ts = date_str / 1000.0
                    date_str = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
            except:
                pass

            tag = "evenrow" if i % 2 == 0 else "oddrow"
            self.tree.insert("", tk.END, values=(
                user.get("fullName", "N/A"),
                user.get("email", "N/A"),
                user.get("password", "N/A"),
                date_str
            ), tags=(tag,))

    def delete_selected_user(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showinfo("No Selection", "Please click on a user row in the table to select them for deletion.")
            return

        # Correctly grab the first selected item ID from the tuple to bypass TclError list lookup bug
        selected_item = selected_items[0]
        item_vals = self.tree.item(selected_item, "values")
        user_name = item_vals[0]
        user_email = item_vals[1]

        # Confirm before deletion
        confirm = messagebox.askyesno(
            "Confirm Delete Account", 
            f"Are you sure you want to permanently delete user account '{user_name}' ({user_email})?\n\nThis action cannot be undone."
        )

        if not confirm:
            return

        # Fire DELETE request
        res, err = self.fetch_api(f"users/{urllib.parse.quote(user_email)}", method="DELETE")
        if res and res.get("success"):
            messagebox.showinfo("User Deleted", f"User account '{user_email}' was successfully deleted from system database.")
            self.refresh_users_list()
        else:
            messagebox.showerror("Deletion Failed", f"Failed to delete user account: {err or 'Unknown connection error.'}")

    def perform_logout(self):
        # Stop background worker thread immediately
        self.refresh_thread_active = False
        self.admin_token = None
        self.admin_username = None
        
        # Show Login gate
        self.show_login_view()

if __name__ == "__main__":
    root = tk.Tk()
    app = AdminPortalApp(root)
    root.mainloop()
