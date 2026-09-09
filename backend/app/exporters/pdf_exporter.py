import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib import colors
from app.schemas.vsm import VSMModel

NAVY = colors.HexColor("#16324F")
BLUE = colors.HexColor("#2F6FAD")
PROCESS_BLUE = colors.HexColor("#16A9D8")
ASSEMBLY_BLUE = colors.HexColor("#4B72B5")
QUALITY_YELLOW = colors.HexColor("#F5B700")
PACKAGE_GOLD = colors.HexColor("#8A6900")
INV_BLUE = colors.HexColor("#5B9BD5")
LIGHT_BG = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#CBD5E1")

def fmt(v):
    try:
        return f"{float(v):.2f}".rstrip('0').rstrip('.')
    except Exception:
        return str(v) if v is not None else "0"

class VSMPDFExporter:
    def export(self, vsm: VSMModel) -> bytes:
        buffer = io.BytesIO()
        # Page size: Landscape A3 for generous width
        page_w, page_h = landscape(A3)
        c = canvas.Canvas(buffer, pagesize=(page_w, page_h))

        # -------------------------------------------------------------
        # PAGE 1: TOP HIERARCHY VSM + TOP HIERARCHY TIMELINE
        # -------------------------------------------------------------
        self._draw_page_header(c, f"{vsm.project.get('name', 'VSM')} — TOP HIERARCHY MAP", page_w, page_h)

        # Draw Top Hierarchy Boxes
        top_boxes = [
            ("Supplier", 80, 680, 140, 50, NAVY, colors.white),
            ("Purchasing", 80, 580, 140, 50, BLUE, colors.white),
            ("Production Control", 320, 580, 180, 50, BLUE, colors.white),
            ("Sales", 650, 680, 140, 50, BLUE, colors.white),
            ("Customer", 900, 680, 140, 50, NAVY, colors.white),
            ("Single Batch", 320, 480, 470, 45, BLUE, colors.white),
        ]

        for label, x, y, w, h, bg, text_c in top_boxes:
            c.setFillColor(bg)
            c.setStrokeColor(NAVY)
            c.setLineWidth(1)
            c.roundRect(x, y, w, h, 4, fill=1, stroke=1)
            c.setFillColor(text_c)
            c.setFont("Helvetica-Bold", 11)
            c.drawCentredString(x + w / 2, y + h / 2 - 4, label)

        # Draw Stage boxes in top hierarchy
        stages = vsm.stages or []
        start_stage_x = 80
        start_stage_y = 350
        stage_spacing_x = 240

        for i, stg in enumerate(stages):
            sx = start_stage_x + i * stage_spacing_x
            sy = start_stage_y
            
            s_name_lower = stg.name.lower()
            bg_c = PACKAGE_GOLD if 'package' in s_name_lower else (ASSEMBLY_BLUE if ('assembly' in s_name_lower or 'build' in s_name_lower) else PROCESS_BLUE)
            
            c.setFillColor(bg_c)
            c.setStrokeColor(NAVY)
            c.roundRect(sx, sy, 160, 55, 4, fill=1, stroke=1)
            c.setFillColor(colors.white)
            c.setFont("Helvetica-Bold", 10)
            c.drawCentredString(sx + 80, sy + 32, stg.name)

            # Show process count
            c.setFont("Helvetica", 8)
            c.drawCentredString(sx + 80, sy + 15, f"{len(stg.processes)} processes")

            # Stage inventory triangle
            inv_qty = stg.inventory if stg.inventory is not None else 35
            self._draw_triangle(c, sx + 195, sy + 25, inv_qty)

            # Arrow between stages
            if i < len(stages) - 1:
                c.setStrokeColor(NAVY)
                c.setLineWidth(1.5)
                c.line(sx + 160, sy + 27, sx + stage_spacing_x, sy + 27)

        # Top Hierarchy Timeline Wave
        top_timeline_items = []
        for stg in stages:
            tot_ct = sum(p.metrics.ct for p in stg.processes) if stg.processes else 0
            tot_mt = sum(p.metrics.mt for p in stg.processes) if stg.processes else 0
            top_timeline_items.append({
                'name': stg.name,
                'ct': tot_ct,
                'mt': tot_mt
            })

        self._draw_wave_timeline(c, top_timeline_items, "TOP HIERARCHY TIMELINE (Stage Summaries)", 50, 180, page_w)

        c.showPage()

        # -------------------------------------------------------------
        # PAGES 2..N: DETAILED SUBASSEMBLY VSM + SUBASSEMBLY TIMELINE
        # -------------------------------------------------------------
        for stage in stages:
            self._draw_page_header(c, f"{stage.name.upper()} — DETAILED PROCESS VSM", page_w, page_h)

            processes = stage.processes or []
            n_procs = len(processes)
            start_proc_x = 60
            start_proc_y = 520
            proc_spacing = max(220, (page_w - 120) / max(n_procs, 1))

            inv_qty = stage.inventory if stage.inventory is not None else 35

            for i, proc in enumerate(processes):
                px = start_proc_x + i * proc_spacing
                py = start_proc_y

                # Process Node Box
                is_qual = any(k in proc.name.lower() for k in ['inspect', 'test', 'quality', 'check'])
                box_c = QUALITY_YELLOW if is_qual else (ASSEMBLY_BLUE if 'assembly' in stage.name.lower() else PROCESS_BLUE)
                text_c = colors.black if is_qual else colors.white

                c.setFillColor(box_c)
                c.setStrokeColor(NAVY)
                c.setLineWidth(1)
                c.roundRect(px, py, 140, 45, 4, fill=1, stroke=1)
                
                c.setFillColor(text_c)
                c.setFont("Helvetica-Bold", 9)
                
                # Multi-line name wrapping
                words = proc.name.split()
                l1 = " ".join(words[:3])
                l2 = " ".join(words[3:]) if len(words) > 3 else ""
                c.drawCentredString(px + 70, py + (25 if l2 else 18), l1[:22])
                if l2:
                    c.drawCentredString(px + 70, py + 10, l2[:22])

                # Metric Table Underneath
                self._draw_process_table(c, px, py - 180, proc.metrics.model_dump())

                # Arrow and Inventory Triangle to next process
                if i < n_procs - 1:
                    c.setStrokeColor(NAVY)
                    c.setLineWidth(1.5)
                    c.line(px + 140, py + 22, px + proc_spacing, py + 22)
                    
                    next_inv = proc.metrics.inventory_after if proc.metrics.inventory_after is not None else inv_qty
                    self._draw_triangle(c, px + 140 + (proc_spacing - 140) / 2, py + 22, next_inv)

            # Subassembly Wave Timeline below diagram
            sub_timeline_items = [
                {'name': p.name, 'ct': p.metrics.ct, 'mt': p.metrics.mt}
                for p in processes
            ]
            
            sub_title = f"{stage.name} TIMELINE — Total C/T: {fmt(sum(p.metrics.ct for p in processes))}h | Total M/T: {fmt(sum(p.metrics.mt for p in processes))}h | Input Inventory: {inv_qty}"
            self._draw_wave_timeline(c, sub_timeline_items, sub_title, 50, 180, page_w)

            c.showPage()

        c.save()
        return buffer.getvalue()

    def _draw_page_header(self, c, title, page_w, page_h):
        c.setFillColor(NAVY)
        c.rect(0, page_h - 45, page_w, 45, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(30, page_h - 30, "VSM STUDIO — MANUFACTURE VALUE STREAM MAP")
        c.setFont("Helvetica", 12)
        c.drawRightString(page_w - 30, page_h - 30, title)

    def _draw_triangle(self, c, x, y, value):
        c.setFillColor(INV_BLUE)
        c.setStrokeColor(NAVY)
        c.setLineWidth(1)
        p = c.beginPath()
        p.moveTo(x, y + 16)
        p.lineTo(x - 16, y - 12)
        p.lineTo(x + 16, y - 12)
        p.close()
        c.drawPath(p, fill=1, stroke=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(x, y - 4, str(fmt(value)))

    def _draw_process_table(self, c, x, y, m):
        w, h = 140, 175
        c.setFillColor(colors.white)
        c.setStrokeColor(BORDER_COLOR)
        c.setLineWidth(1)
        c.rect(x, y, w, h, fill=1, stroke=1)

        rows = [
            ("C/T", fmt(m.get('ct'))),
            ("M/T", fmt(m.get('mt'))),
            ("U/T", fmt(m.get('ut'))),
            ("S/T", fmt(m.get('st'))),
            ("Op", str(m.get('op', 1))),
            ("Scrap", f"{m.get('scrap', 0) * 100:.1f}%"),
            ("RFT", f"{m.get('rft', 1.0) * 100:.1f}%"),
        ]

        rh = h / len(rows)
        for i, (k, v) in enumerate(rows):
            ry = y + h - (i + 1) * rh
            c.setStrokeColor(BORDER_COLOR)
            c.line(x, ry, x + w, ry)
            c.line(x + 55, ry, x + 55, ry + rh)
            
            c.setFillColor(NAVY)
            c.setFont("Helvetica-Bold", 8)
            c.drawString(x + 8, ry + 6, k)
            
            c.setFont("Helvetica", 8)
            c.drawRightString(x + w - 8, ry + 6, str(v))

    def _draw_wave_timeline(self, c, items, title, start_x, start_y, page_w):
        if not items:
            return

        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(start_x, start_y + 45, title)

        n = len(items)
        seg_w = min(160, (page_w - 120) / n)
        baseline_y = start_y
        proc_h = 25
        wait_h = 25

        for i, item in enumerate(items):
            x = start_x + i * seg_w
            half = seg_w / 2

            # Yellow fill if mt > 0
            if item['mt'] > 0:
                c.setFillColor(QUALITY_YELLOW)
                c.rect(x, baseline_y, half, wait_h, fill=1, stroke=0)

            # Wave lines
            c.setStrokeColor(NAVY)
            c.setLineWidth(1.8)
            
            # Wait segment (upper)
            c.line(x, baseline_y, x, baseline_y + wait_h)
            c.line(x, baseline_y + wait_h, x + half, baseline_y + wait_h)
            c.line(x + half, baseline_y + wait_h, x + half, baseline_y)

            # Process segment (lower)
            c.line(x + half, baseline_y, x + half, baseline_y - proc_h)
            c.line(x + half, baseline_y - proc_h, x + seg_w, baseline_y - proc_h)
            c.line(x + seg_w, baseline_y - proc_h, x + seg_w, baseline_y)

            # Process Name Above
            c.setFillColor(NAVY)
            c.setFont("Helvetica-Bold", 8)
            name_text = item['name'][:18] + '…' if len(item['name']) > 18 else item['name']
            c.drawCentredString(x + half / 2, baseline_y + wait_h + 8, name_text)

            # Labels
            c.setFont("Helvetica", 8)
            c.drawCentredString(x + half / 2, baseline_y + 8, f"M/T={fmt(item['mt'])}")
            c.drawCentredString(x + half + half / 2, baseline_y - proc_h + 8, f"C/T={fmt(item['ct'])}")
