from pathlib import Path
import math
import re
import zipfile
import xml.etree.ElementTree as ET
from difflib import SequenceMatcher

import openpyxl
import matplotlib as mpl
mpl.rcParams['pdf.fonttype'] = 42
mpl.rcParams['ps.fonttype'] = 42
mpl.rcParams['text.antialiased'] = True
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, FancyArrowPatch
from matplotlib.backends.backend_pdf import PdfPages

BASE_DIR = Path(__file__).resolve().parent
MAIN_BOOK = BASE_DIR / 'Book1.xlsx'
SUB_BOOK = BASE_DIR / 'Book2.xlsx'
FULL_BOOK = BASE_DIR / 'VSM_Fibre-Q_2024.xlsx'
OUTPUT = BASE_DIR / 'VSM_FINAL.pdf'
STARTING_INVENTORY = 35

BLUE = '#4472C4'
PROCESS_BLUE = '#00A6D6'
PACKAGE = '#806000'
QUALITY = '#FFC000'
INV_BLUE = '#5B9BD5'
BLACK = '#000000'
WHITE = '#FFFFFF'

ALIASES = {
    'fibre prep fiber': 'Fibre Prep',
    'fibre prep': 'Fibre Prep',
    'fibre prep fiber ': 'Fibre Prep',
    'cell build': 'Cell Build',
    'package assembly': 'Package Assembly',
    'ca': 'Collimator Assembly',
    'collimator assembly': 'Collimator Assembly',
    'ctia': 'CTIA',
}

STAGES = ['Fibre Prep', 'Cell Build', 'Package Assembly', 'Collimator Assembly']


def fmt(v):
    try:
        return f'{float(v):.2f}'.rstrip('0').rstrip('.')
    except Exception:
        return '' if v is None else str(v)


def pct(v):
    try:
        x = float(v)
        # Data sheet stores RFT as a fraction, input.json may store percentage.
        if abs(x) <= 1.000001:
            x *= 100
        return f'{x:.2f}%'.rstrip('0').rstrip('.') + ('%' if not f'{x:.2f}'.endswith('%') else '')
    except Exception:
        return '' if v is None else str(v)


def pct_clean(v):
    try:
        x = float(v)
        if abs(x) <= 1.000001:
            x *= 100
        return f'{x:.2f}%'
    except Exception:
        return '' if v is None else str(v)


def wrap_text(text, max_chars=18, max_lines=4):
    words = str(text).split()
    lines, line = [], ''
    for word in words:
        test = (line + ' ' + word).strip()
        if line and len(test) > max_chars:
            lines.append(line)
            line = word
        else:
            line = test
    if line:
        lines.append(line)
    return '\n'.join(lines[:max_lines])


def normalize(s):
    return re.sub(r'[^a-z0-9]+', ' ', str(s).lower()).strip()


def stage_color(stage):
    s = stage.lower()
    if 'package' in s:
        return PACKAGE
    if 'assembly' in s or 'build' in s:
        return BLUE
    return PROCESS_BLUE


def is_quality(name):
    s = name.lower()
    return any(k in s for k in ('inspection', 'test', 'quality', 'vswr', 'leak', 'pre-lid'))


def arrow(ax, p1, p2, color=BLACK, lw=1.5, ms=9):
    ax.add_patch(FancyArrowPatch(
        p1, p2,
        arrowstyle='-|>',
        mutation_scale=ms,
        linewidth=lw,
        color=color,
        zorder=10,
        shrinkA=0,
        shrinkB=0,
    ))


def triangle(ax, x, y, value, w=0.58, h=0.58):
    ax.add_patch(Polygon(
        [(x, y + h / 2), (x - w / 2, y - h / 2), (x + w / 2, y - h / 2)],
        closed=True,
        facecolor=INV_BLUE,
        edgecolor=INV_BLUE,
        zorder=8,
    ))
    ax.text(
        x, y, str(int(value) if float(value).is_integer() else fmt(value)),
        ha='center', va='center', color=WHITE,
        fontsize=7, fontweight='bold', zorder=9,
    )


def process_table(ax, x, y, p):
    rows = [
        ('C/T', fmt(p['ct'])),
        ('M/T', fmt(p['mt'])),
        ('U/T', fmt(p['ut'])),
        ('S/T', fmt(p['st'])),
        ('Scrap', pct_clean(p['scrap'])),
        ('Op', str(p['op'])),
        ('RFT', pct_clean(p['rft'])),
    ]
    w, rh, split = 1.25, 0.19, 0.52
    h = rh * len(rows)
    ax.add_patch(Rectangle((x, y), w, h, facecolor=WHITE, edgecolor=BLACK, linewidth=0.75))
    ax.plot([x + split, x + split], [y, y + h], color=BLACK, linewidth=0.55)
    for i, (k, v) in enumerate(rows):
        yy = y + h - (i + 1) * rh
        if i:
            ax.plot([x, x + w], [yy + rh, yy + rh], color=BLACK, linewidth=0.5)
        ax.text(x + 0.04, yy + rh / 2, k, ha='left', va='center', fontsize=5.2)
        ax.text(x + split + 0.04, yy + rh / 2, v, ha='left', va='center', fontsize=5.2)


def wave_timeline(ax, items, title='TIME LINE'):
    # Visual widths are fixed. Actual C/T and M/T remain the labels.
    PROCESS_WIDTH = 1.0
    WAIT_WIDTH = 0.42
    y_low, y_high = 0.0, 1.0

    x = 0.0
    current_y = y_low
    x_coords = [0.0, 0.0]
    y_coords = [y_high, y_low]
    process_centers = []

    for p in items:
        # Processing segment
        width = PROCESS_WIDTH
        target_y = y_low
        if current_y != target_y:
            x_coords.extend([x, x])
            y_coords.extend([current_y, target_y])
            current_y = target_y
        x_next = x + width
        x_coords.extend([x, x_next])
        y_coords.extend([current_y, current_y])
        ax.text(x + width / 2, current_y + 0.055, fmt(p['ct']),
                ha='center', va='bottom', fontsize=7, color=BLACK, zorder=5)
        process_centers.append((x + width / 2, p['name']))
        x = x_next

        # Wait segment
        width = WAIT_WIDTH
        target_y = y_high
        if current_y != target_y:
            x_coords.extend([x, x])
            y_coords.extend([current_y, target_y])
            current_y = target_y
        x_next = x + width
        x_coords.extend([x, x_next])
        y_coords.extend([current_y, current_y])
        if float(p.get('mt', 0)) > 0:
            ax.add_patch(Rectangle(
                (x, y_high - 0.018), width, 0.08,
                linewidth=0, facecolor=QUALITY, edgecolor=QUALITY, zorder=1
            ))
        ax.text(x + width / 2, current_y + 0.055, fmt(p['mt']),
                ha='center', va='bottom', fontsize=7, color=BLACK, zorder=5)
        x = x_next

        # Drop back to processing before the next process.
        target_y = y_low
        if current_y != target_y:
            x_coords.extend([x, x])
            y_coords.extend([current_y, target_y])
            current_y = target_y

    ax.plot(x_coords, y_coords, color=BLACK, linewidth=2.2,
            solid_capstyle='butt', solid_joinstyle='miter', zorder=3)

    for center, name in process_centers:
        ax.text(center, 1.29, wrap_text(name, 18, 3),
                ha='center', va='bottom', fontsize=5.5,
                rotation=25, color=BLACK)

    ax.set_yticks([y_low, y_high])
    ax.set_yticklabels(['Processing', 'Wait'], fontsize=9, fontweight='bold')
    ax.text(0, 1.57, title, ha='left', va='top', fontsize=12, fontweight='bold')
    ax.set_xlim(-0.65, x + 0.25)
    ax.set_ylim(-0.18, 1.70)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.get_xaxis().set_visible(False)
    ax.tick_params(axis='y', which='both', length=0)


def choose_workbooks():
    # Book1.xlsx is the main VSM map, Book2.xlsx contains the subassembly maps,
    # while the original full workbook contains the authoritative Data sheet.
    main = FULL_BOOK if FULL_BOOK.exists() else MAIN_BOOK
    if not main.exists():
        main = MAIN_BOOK
    sub = SUB_BOOK if SUB_BOOK.exists() else FULL_BOOK
    return main, sub


def load_data(main_book):
    wb = openpyxl.load_workbook(main_book, data_only=True, read_only=True)
    ws = wb['Data']
    data = {}
    stage = None
    for row in ws.iter_rows(min_row=1, max_col=10, values_only=True):
        a, b, c, mt, ut, st, op, ct, scrap, rft = row
        if a is not None:
            key = ' '.join(str(a).strip().lower().split())
            stage = ALIASES.get(key, str(a).strip())
        if stage and c is not None and ct is not None:
            data.setdefault(stage, []).append({
                'name': str(c).strip(),
                'mt': float(mt or 0),
                'ut': float(ut or 0),
                'st': float(st or 0),
                'op': int(op or 0),
                'ct': float(ct),
                'scrap': float(scrap or 0),
                'rft': float(rft or 0),
                'stage': stage,
            })
    return data


def drawing_text_objects(xlsx_path):
    """Read visible text from the workbook's drawing XML without modifying Excel."""
    if not xlsx_path.exists():
        return []
    try:
        with zipfile.ZipFile(xlsx_path) as z:
            names = [n for n in z.namelist() if n.startswith('xl/drawings/drawing') and n.endswith('.xml')]
            if not names:
                return []
            root = ET.fromstring(z.read(names[0]))
    except Exception:
        return []

    ns = {
        'xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    }
    out = []
    for anchor in root:
        fr = anchor.find('xdr:from', ns)
        if fr is None:
            continue
        row_text = fr.findtext('xdr:row', namespaces=ns)
        col_text = fr.findtext('xdr:col', namespaces=ns)
        if row_text is None or col_text is None:
            continue
        txt = ' '.join((t.text or '') for t in anchor.findall('.//a:t', ns)).strip()
        if not txt:
            continue
        try:
            row, col = int(row_text), int(col_text)
        except ValueError:
            continue
        out.append((row, col, txt))
    return out


def extract_stage_input_inventories(sub_book, data):
    """
    Recover the stage-entry inventory from the supplied subassembly workbook.

    This is intentionally data-driven: the triangle numbers already present in
    Book2.xlsx are read from its drawing XML. We do not reset every stage to 35.
    For the supplied workbook this yields:
        Cell Build       -> 28
        Package Assembly -> 28
        Collimator       -> 25
    """
    objects = drawing_text_objects(sub_book)
    numeric = []
    text_objects = []
    for row, col, txt in objects:
        if re.fullmatch(r'\d+(?:\.\d+)?', txt):
            numeric.append((row, col, float(txt)))
        else:
            text_objects.append((row, col, txt))

    result = {}
    for stage in STAGES:
        if stage not in data or stage == 'Fibre Prep':
            continue
        first_process = data[stage][0]['name']
        target = normalize(first_process)
        if not target:
            continue

        best = None
        best_score = 0.0
        for row, col, txt in text_objects:
            score = SequenceMatcher(None, target, normalize(txt)).ratio()
            # Prefer process-like text near the beginning of a section.
            if score > best_score:
                best_score = score
                best = (row, col, txt)
        if best is None:
            continue

        first_row = best[0]
        candidates = [v for r, c, v in numeric if first_row - 5 <= r <= first_row + 1]
        if candidates:
            # The source has repeated identical triangle values across the row.
            # Mode is therefore safer than taking an arbitrary triangle.
            counts = {}
            for v in candidates:
                counts[v] = counts.get(v, 0) + 1
            result[stage] = max(counts, key=counts.get)

    return result


def stage_summary(stage, processes):
    return {
        'name': stage,
        'stage': stage,
        'ct': sum(p['ct'] for p in processes),
        'mt': sum(p['mt'] for p in processes),
    }


def generate():
    main_book, sub_book = choose_workbooks()
    data = load_data(main_book)
    stage_inventory = extract_stage_input_inventories(sub_book, data)

    # First/root stage uses the actual starting inventory from the VSM input.
    stage_inventory['Fibre Prep'] = STARTING_INVENTORY

    # If a workbook does not contain a triangle for a stage, carry forward from
    # its explicit upstream branch. This is a fallback, not the normal path for
    # the supplied company workbook.
    if 'Cell Build' not in stage_inventory:
        stage_inventory['Cell Build'] = STARTING_INVENTORY
    if 'Package Assembly' not in stage_inventory:
        stage_inventory['Package Assembly'] = stage_inventory['Cell Build']
    if 'Collimator Assembly' not in stage_inventory:
        stage_inventory['Collimator Assembly'] = stage_inventory['Fibre Prep']

    summaries = [stage_summary(s, data[s]) for s in STAGES if s in data]

    with PdfPages(OUTPUT, metadata={
        'Title': 'Fibre-Q Value Stream Map',
        'Author': 'Automatic VSM Generator',
        'Subject': 'Top hierarchy and subassembly VSM',
    }) as pdf:
        # -------------------------------------------------------------
        # PAGE 1: TOP HIERARCHY
        # -------------------------------------------------------------
        fig = plt.figure(figsize=(16.5, 11.7), dpi=300)
        ax = fig.add_axes([.025, .31, .95, .64])
        ax.axis('off')
        ax.set_xlim(0, 17)
        ax.set_ylim(0, 10)
        ax.text(8.5, 9.55, 'Fibre-Q — TOP HIERARCHY VALUE STREAM MAP',
                ha='center', fontsize=19, fontweight='bold')

        # Sales is deliberately above Production Control, as in the reference.
        boxes = [
            ('Supplier', .35, 8.0, 1.8, .72, BLUE),
            ('Purchasing', 2.8, 8.0, 1.8, .72, BLUE),
            ('Sales', 8.0, 8.15, 1.8, .72, BLUE),
            ('Customer', 12.1, 8.15, 1.95, .72, BLUE),
            ('Production Control', 7.45, 6.75, 2.55, .72, BLUE),
            ('Single batch', 5.0, 5.35, 5.0, .62, BLUE),
            ('Fibre Prep', 1.0, 3.65, 2.15, .72, PROCESS_BLUE),
            ('Cell Build', 4.1, 1.95, 2.15, .72, PROCESS_BLUE),
            ('Collimator Assembly', 9.9, 3.65, 2.25, .72, BLUE),
            ('Package Assembly', 10.0, 1.95, 2.25, .72, PACKAGE),
            ('Alignment + Sleeving\n+ Lidding', 6.3, .45, 3.0, .72, BLUE),
            ('Fibre-Q', 10.7, .45, 1.9, .72, QUALITY),
        ]
        for label, x, y, w, h, c in boxes:
            ax.add_patch(Rectangle((x, y), w, h, facecolor=c, edgecolor=BLACK, linewidth=.8))
            ax.text(x + w / 2, y + h / 2, label,
                    ha='center', va='center', fontsize=8,
                    color=BLACK if c == QUALITY else WHITE, fontweight='bold')

        # Supplier -> Purchasing.
        arrow(ax, (2.15, 8.36), (2.8, 8.36), INV_BLUE, 2.5)
        # Purchasing -> Production Control.
        arrow(ax, (3.7, 8.0), (7.45, 7.11), INV_BLUE, 2.5)
        # Customer -> Sales (customer demand direction toward Sales).
        arrow(ax, (12.1, 8.51), (9.8, 8.51), INV_BLUE, 2.5)
        # Sales -> Customer (return/response flow back to Customer).
        arrow(ax, (9.8, 8.31), (12.1, 8.31), INV_BLUE, 2.5)
        # Sales -> Production Control: explicit downward arrow.
        arrow(ax, (8.9, 8.15), (8.72, 7.47), INV_BLUE, 2.5)
        # Production Control -> Single batch.
        arrow(ax, (8.72, 6.75), (7.5, 5.97), INV_BLUE, 2.5)

        # Single batch fans out to each stage.
        for _, x, y, w, h, c in boxes[6:10]:
            arrow(ax, (7.5, 5.35), (x + w / 2, y + h), BLACK, 1.3)

        # Correct branch connections.
        # Fibre Prep -> Collimator Assembly.
        arrow(ax, (3.15, 4.01), (9.9, 4.01), BLACK, 1.5)
        # Cell Build -> Package Assembly.
        arrow(ax, (6.25, 2.31), (10.0, 2.31), BLACK, 1.5)
        # Both assemblies feed Alignment + Sleeving + Lidding.
        arrow(ax, (11.025, 3.65), (8.9, 1.17), BLACK, 1.5)
        arrow(ax, (11.125, 1.95), (8.9, 1.17), BLACK, 1.5)
        # Final product.
        arrow(ax, (9.3, .81), (10.7, .81), BLACK, 1.5)

        # Inventory symbols on the four stage branches.
        triangle(ax, 3.65, 4.02, stage_inventory['Fibre Prep'])
        triangle(ax, 7.55, 2.32, stage_inventory['Cell Build'])
        triangle(ax, 8.0, 3.55, stage_inventory['Collimator Assembly'])
        triangle(ax, 8.0, 1.82, stage_inventory['Package Assembly'])

        tl = fig.add_axes([.025, .06, .95, .20])
        wave_timeline(tl, summaries, 'TOP HIERARCHY — TIME LINE')
        tl.text(len(summaries) / 2, .015,
                'Top hierarchy timeline — stage C/T and M/T totals',
                ha='center', va='bottom', fontsize=8, fontweight='bold')
        pdf.savefig(fig, bbox_inches='tight', dpi=300)
        plt.close(fig)

        # -------------------------------------------------------------
        # SUBASSEMBLY PAGES
        # -------------------------------------------------------------
        for stage in STAGES:
            if stage not in data:
                continue
            ps = data[stage]
            n = len(ps)
            W = n * 1.45 + 1
            fig = plt.figure(figsize=(max(16.5, W), 11.7), dpi=300)
            ax = fig.add_axes([.012, .42, .976, .53])
            ax.axis('off')
            ax.set_xlim(0, W)
            ax.set_ylim(0, 6)

            ax.add_patch(Rectangle((.25, 5.35), W - .5, .48,
                                   facecolor=stage_color(stage), edgecolor=BLACK))
            ax.text(W / 2, 5.59, f'{stage} — PROCESS VSM',
                    ha='center', va='center', fontsize=13,
                    color=WHITE, fontweight='bold')

            gap = (W - .7) / n
            bw = min(1.08, gap * .68)
            inventory = int(stage_inventory.get(stage, STARTING_INVENTORY))

            for i, p in enumerate(ps):
                x = .25 + i * gap
                col, tc = ((QUALITY, BLACK) if is_quality(p['name'])
                           else (stage_color(stage), WHITE))
                ax.add_patch(Rectangle((x, 3.52), bw, .64,
                                       facecolor=col, edgecolor=BLACK, linewidth=.8))
                ax.text(x + bw / 2, 3.84, wrap_text(p['name']),
                        ha='center', va='center', fontsize=6.1,
                        color=tc, fontweight='bold')
                process_table(ax, x, 1.72, p)

                if i < n - 1:
                    arrow(ax, (x + bw, 3.84), (x + gap, 3.84), BLACK, 1.3)
                    # The source subassembly maps use one inventory quantity
                    # for the WIP entering that subassembly. Do NOT reset it
                    # to 35 for every stage.
                    triangle(ax, x + gap - .30, 4.22, inventory)

            tl = fig.add_axes([.012, .065, .976, .28])
            wave_timeline(tl, ps, f'{stage} — TIME LINE')
            tl.text(n / 2, .015,
                    f'{stage} — Total C/T = {fmt(sum(p["ct"] for p in ps))} h | '
                    f'Total M/T = {fmt(sum(p["mt"] for p in ps))} h | '
                    f'Input inventory = {inventory}',
                    ha='center', va='bottom', fontsize=8, fontweight='bold')
            pdf.savefig(fig, bbox_inches='tight', dpi=300)
            plt.close(fig)

    print(f'Generated: {OUTPUT}')
    print('Stage input inventories:', {s: stage_inventory.get(s) for s in STAGES})


if __name__ == '__main__':
    generate()