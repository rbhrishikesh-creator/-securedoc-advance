import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "diagrams"))
os.makedirs(OUT_DIR, exist_ok=True)

plt.rcParams['font.family'] = 'DejaVu Sans'

def create_architecture_diagram():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Title
    ax.text(50, 96, "SecureDoc Advanced — Layered System Architecture", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#0f172a')

    layers = [
        ("PRESENTATION LAYER (Frontend SPA - React 18 + TypeScript + Vite)",
         ["Executive Security Dashboard", "Document Vault & Explorer", "Secure Upload & Version Diff", 
          "Real-Time Comments & Presence", "Gemini AI Copilot Modal"],
         80, "#f8fafc", "#e2e8f0", "#4f46e5"),
        ("API GATEWAY & SECURITY LAYER (Express.js / Node.js LTS)",
         ["JWT Auth Middleware", "RBAC Role Guards", "Redis Sliding Rate Limiter", "CORS & Helmet Protection"],
         63, "#f8fafc", "#e2e8f0", "#0284c7"),
        ("BUSINESS LOGIC & DOMAIN WORKFLOW ENGINE",
         ["AES-256-GCM Envelope Encryption", "Version Lineage & Rollback Service", 
          "Dynamic Watermark Canvas", "Forensic Audit Trail Logger"],
         46, "#f8fafc", "#e2e8f0", "#059669"),
        ("INTELLIGENCE & AI COPILOT LAYER",
         ["Google Gemini 2.5 Flash LLM", "Tool Calling Orchestrator", "Forensic Risk Meter (0-100)", "Semantic Document Summarizer"],
         29, "#f8fafc", "#e2e8f0", "#d97706"),
        ("DATA PERSISTENCE & CACHING LAYER",
         ["MongoDB Atlas (Mongoose 8 ODM - 8 Collections)", "Redis 7 (In-Memory Micro-Caching & Atomic Single-Use Tokens)"],
         12, "#f8fafc", "#e2e8f0", "#dc2626")
    ]

    for title, items, y_pos, bg, border, accent in layers:
        # Layer container
        rect = patches.FancyBboxPatch((4, y_pos), 92, 14,
                                      boxstyle="round,pad=0.5,rounding_size=1.5",
                                      facecolor=bg, edgecolor=border, linewidth=1.5)
        ax.add_patch(rect)
        
        # Layer Header
        ax.text(6, y_pos + 11.5, title, fontsize=9, fontweight='bold', color=accent)

        # Inner components
        n = len(items)
        spacing = 90 / n
        for i, item in enumerate(items):
            bx = 5 + i * spacing
            bw = spacing - 1.5
            box = patches.FancyBboxPatch((bx, y_pos + 2), bw, 7.5,
                                         boxstyle="round,pad=0.3,rounding_size=1",
                                         facecolor="white", edgecolor=border, linewidth=1)
            ax.add_patch(box)
            ax.text(bx + bw/2, y_pos + 5.7, item, fontsize=7.5, ha='center', va='center', 
                    fontweight='medium', color='#1e293b', wrap=True)

    plt.tight_layout()
    out_file = os.path.join(OUT_DIR, "fig_4_1_architecture.png")
    plt.savefig(out_file, bbox_inches='tight', dpi=300)
    plt.close()
    print("Saved Architecture Diagram to:", out_file)

def create_class_diagram():
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 97, "SecureDoc Advanced — UML Class / Mongoose Document Models Diagram", 
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')

    classes = [
        # x, y, w, h, title, fields
        (5, 65, 26, 28, "User", [
            "<<Document>>",
            "+ _id: ObjectId [PK]",
            "+ name: String",
            "+ email: String [Unique]",
            "+ passwordHash: String",
            "+ role: String (Admin|Member|Guest)",
            "+ isVerified: Boolean",
            "+ createdAt: Date",
            "+ comparePassword(): Boolean"
        ]),
        (37, 65, 27, 28, "Document", [
            "<<Document>>",
            "+ _id: ObjectId [PK]",
            "+ title: String",
            "+ originalName: String",
            "+ mimeType: String",
            "+ size: Number",
            "+ currentVersion: Number",
            "+ ownerId: ObjectId [FK]",
            "+ isStarred: Boolean",
            "+ isDeleted: Boolean"
        ]),
        (69, 65, 26, 28, "DocumentVersion", [
            "<<Document>>",
            "+ _id: ObjectId [PK]",
            "+ documentId: ObjectId [FK]",
            "+ versionNumber: Number",
            "+ encryptedFileName: String",
            "+ iv: String (96-bit GCM)",
            "+ authTag: String (16-byte)",
            "+ sha256Checksum: String",
            "+ uploadedBy: ObjectId [FK]",
            "+ createdAt: Date"
        ]),
        (5, 25, 26, 28, "SharePermission", [
            "<<Document>>",
            "+ _id: ObjectId [PK]",
            "+ documentId: ObjectId [FK]",
            "+ userId: ObjectId [FK]",
            "+ permission: String",
            "+ isPublic: Boolean",
            "+ shareToken: String",
            "+ expiresAt: Date"
        ]),
        (37, 25, 27, 28, "AuditLog", [
            "<<Document>>",
            "+ _id: ObjectId [PK]",
            "+ userId: ObjectId [FK]",
            "+ action: String",
            "+ resourceType: String",
            "+ resourceId: ObjectId",
            "+ ipAddress: String",
            "+ timestamp: Date",
            "+ logAction(): Void"
        ]),
        (69, 25, 26, 28, "Comment", [
            "<<Document>>",
            "+ _id: ObjectId [PK]",
            "+ documentId: ObjectId [FK]",
            "+ userId: ObjectId [FK]",
            "+ text: String",
            "+ createdAt: Date"
        ])
    ]

    for x, y, w, h, name, fields in classes:
        # Header rect
        hdr = patches.Rectangle((x, y + h - 6), w, 6, facecolor="#1e293b", edgecolor="#0f172a", linewidth=1.2)
        ax.add_patch(hdr)
        ax.text(x + w/2, y + h - 3, name, ha='center', va='center', fontsize=9.5, fontweight='bold', color='white')

        # Body rect
        body = patches.Rectangle((x, y), w, h - 6, facecolor="#f8fafc", edgecolor="#cbd5e1", linewidth=1.2)
        ax.add_patch(body)

        for idx, f in enumerate(fields):
            weight = 'bold' if '<<' in f or '[PK]' in f else 'normal'
            color = '#475569' if '<<' in f else '#1e293b'
            ax.text(x + 1, y + h - 8 - idx * 2.3, f, fontsize=7.2, va='center', fontweight=weight, color=color)

    # Relationship connectors
    ax.annotate("", xy=(37, 78), xytext=(31, 78), arrowprops=dict(arrowstyle="->", color="#4f46e5", lw=1.5))
    ax.text(34, 80, "1..*", fontsize=7.5, color="#4f46e5", fontweight='bold')

    ax.annotate("", xy=(69, 78), xytext=(64, 78), arrowprops=dict(arrowstyle="->", color="#4f46e5", lw=1.5))
    ax.text(66.5, 80, "1..*", fontsize=7.5, color="#4f46e5", fontweight='bold')

    ax.annotate("", xy=(18, 53), xytext=(18, 65), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5))
    ax.annotate("", xy=(50, 53), xytext=(50, 65), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5))
    ax.annotate("", xy=(82, 53), xytext=(82, 65), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=1.5))

    plt.tight_layout()
    out_file = os.path.join(OUT_DIR, "fig_4_2_class_diagram.png")
    plt.savefig(out_file, bbox_inches='tight', dpi=300)
    plt.close()
    print("Saved Class Diagram to:", out_file)

def create_sequence_diagram():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 97, "Secure Document Upload, Encryption & Real-Time Sync Sequence Diagram", 
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')

    actors = [
        (10, "Client SPA\n(React 18)"),
        (30, "Express API\n(Gateway)"),
        (50, "Crypto Engine\n(AES-256-GCM)"),
        (70, "MongoDB Atlas\n(Data Store)"),
        (90, "Socket.IO / Redis\n(Presence/Cache)")
    ]

    for x, label in actors:
        # Actor box
        box = patches.FancyBboxPatch((x - 7, 86), 14, 8, boxstyle="round,pad=0.3", 
                                     facecolor="#1e293b", edgecolor="#0f172a")
        ax.add_patch(box)
        ax.text(x, 90, label, ha='center', va='center', fontsize=8, color='white', fontweight='bold')
        
        # Lifeline
        ax.plot([x, x], [86, 8], color="#94a3b8", linestyle="--", linewidth=1.2)

    messages = [
        (10, 30, 80, "1: POST /api/documents/upload (Multipart & JWT)"),
        (30, 50, 72, "2: encryptFileStream(fileBuffer, masterKEK)"),
        (50, 50, 65, "3: Generate 256-bit DEK, 96-bit IV, AuthTag & SHA-256", True),
        (50, 30, 57, "4: Return Ciphertext, IV, AuthTag, Wrapped DEK"),
        (30, 70, 49, "5: Save Document & Version Metadata (Zero-Plaintext)"),
        (70, 30, 42, "6: Return Document ID & Version Confirmation"),
        (30, 90, 34, "7: Broadcast 'activity:feed' & Invalidate Cache"),
        (30, 70, 26, "8: Write Forensic Audit Log ('DOCUMENT_UPLOAD')"),
        (30, 10, 18, "9: 201 Created (Decrypted Metadata Preview)")
    ]

    for item in messages:
        if len(item) == 4:
            x1, x2, y, txt = item
            is_self = False
        else:
            x1, x2, y, txt, is_self = item

        if is_self:
            # Self arrow
            ax.annotate("", xy=(x1 + 6, y - 2), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color="#d97706", lw=1.3))
            ax.plot([x1, x1 + 6, x1 + 6], [y, y, y - 2], color="#d97706", lw=1.3)
            ax.text(x1 + 7, y - 1, txt, fontsize=7.5, color="#b45309", fontweight='bold')
        else:
            style = "->"
            color = "#0284c7" if x1 < x2 else "#059669"
            ax.annotate("", xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle=style, color=color, lw=1.3))
            mid_x = (x1 + x2) / 2
            ax.text(mid_x, y + 1.8, txt, fontsize=7.5, ha='center', color="#0f172a", fontweight='medium')

    plt.tight_layout()
    out_file = os.path.join(OUT_DIR, "fig_4_3_sequence_diagram.png")
    plt.savefig(out_file, bbox_inches='tight', dpi=300)
    plt.close()
    print("Saved Sequence Diagram to:", out_file)

if __name__ == '__main__':
    create_architecture_diagram()
    create_class_diagram()
    create_sequence_diagram()
