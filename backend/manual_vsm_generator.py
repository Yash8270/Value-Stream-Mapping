from pathlib import Path
import json
import textwrap

import matplotlib as mpl
mpl.rcParams["pdf.fonttype"] = 42
mpl.rcParams["ps.fonttype"] = 42
mpl.rcParams["text.antialiased"] = True
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon, FancyArrowPatch
from matplotlib.backends.backend_pdf import PdfPages

BASE_DIR = Path(__file__).resolve().parent
INPUT = BASE_DIR / "manual_vsm_input.json"
OUTPUT = BASE_DIR / "VSM_MANUAL_INPUT.pdf"

BLUE = "#4472C4"
PROCESS_BLUE = "#00A6D6"
PACKAGE = "#806000"
QUALITY = "#FFC000"
INV_BLUE = "#5B9BD5"
BLACK = "#000000"
WHITE = "#FFFFFF"


def fmt(v):
    try:
        return f"{float(v):.2f}".rstrip("0").rstrip(".")
    except Exception:
        return str(v)


def pct(v):
    try:
        x = float(v)
        if abs(x) <= 1:
            x *= 100
        return f"{x:.2f}%"
    except Exception:
        return str(v)


def wrap(text, width=18):
    return "\n".join(textwrap.wrap(str(text), width=width)[:4])


def arrow(ax, p1, p2, color=BLACK, lw=1.5, ms=9):
    ax.add_patch(FancyArrowPatch(
        p1, p2, arrowstyle="-|>", mutation_scale=ms,
        linewidth=lw, color=color, zorder=20,
        shrinkA=0, shrinkB=0
    ))


def triangle(ax, x, y, value, w=.58, h=.58):
    ax.add_patch(Polygon(
        [(x, y+h/2), (x-w/2, y-h/2), (x+w/2, y-h/2)],
        closed=True, facecolor=INV_BLUE, edgecolor=INV_BLUE, zorder=8
    ))
    ax.text(
        x, y, fmt(value), ha="center", va="center",
        color=WHITE, fontsize=7, fontweight="bold", zorder=9
    )


def process_table(ax, x, y, p):
    rows = [
        ("C/T", fmt(p["ct"])),
        ("M/T", fmt(p["mt"])),
        ("U/T", fmt(p["ut"])),
        ("S/T", fmt(p["st"])),
        ("Scrap", pct(p["scrap"])),
        ("Op", str(p["op"])),
        ("RFT", pct(p["rft"])),
    ]

    w, rh, split = 1.25, .19, .52
    h = rh * len(rows)

    ax.add_patch(Rectangle(
        (x, y), w, h, facecolor=WHITE,
        edgecolor=BLACK, linewidth=.75
    ))
    ax.plot(
        [x+split, x+split], [y, y+h],
        color=BLACK, linewidth=.55
    )

    for i, (k, v) in enumerate(rows):
        yy = y + h - (i+1)*rh
        if i:
            ax.plot(
                [x, x+w], [yy+rh, yy+rh],
                color=BLACK, linewidth=.5
            )
        ax.text(
            x+.04, yy+rh/2, k,
            ha="left", va="center", fontsize=5.2
        )
        ax.text(
            x+split+.04, yy+rh/2, v,
            ha="left", va="center", fontsize=5.2
        )


def is_quality(name):
    s = str(name).lower()
    return any(k in s for k in (
        "inspection", "test", "quality",
        "vswr", "leak", "pre-lid"
    ))


def wave_timeline(ax, items, title):
    # These are VISUAL widths only.
    PROCESS_WIDTH = 1.0
    WAIT_WIDTH = .42

    low, high = 0.0, 1.0
    x = 0.0
    current = low

    xs = [0.0, 0.0]
    ys = [high, low]

    names = []

    for p in items:
        # Processing = low
        target = low
        if current != target:
            xs.extend([x, x])
            ys.extend([current, target])
            current = target

        x2 = x + PROCESS_WIDTH
        xs.extend([x, x2])
        ys.extend([current, current])

        ax.text(
            (x+x2)/2, low+.055, fmt(p["ct"]),
            ha="center", va="bottom", fontsize=7
        )
        names.append(((x+x2)/2, p["name"]))

        x = x2

        # Wait = high
        target = high
        xs.extend([x, x])
        ys.extend([current, target])
        current = target

        x2 = x + WAIT_WIDTH
        xs.extend([x, x2])
        ys.extend([current, current])

        if float(p.get("mt", 0)) > 0:
            ax.add_patch(Rectangle(
                (x, high), WAIT_WIDTH, .08,
                facecolor=QUALITY, edgecolor=QUALITY, zorder=1
            ))

        ax.text(
            (x+x2)/2, high+.055, fmt(p["mt"]),
            ha="center", va="bottom", fontsize=7
        )

        x = x2

    ax.plot(
        xs, ys, color=BLACK, linewidth=2.2,
        solid_capstyle="butt", solid_joinstyle="miter",
        zorder=3
    )

    for center, name in names:
        ax.text(
            center, 1.29, wrap(name, 18),
            ha="center", va="bottom",
            fontsize=5.5, rotation=25
        )

    ax.set_yticks([low, high])
    ax.set_yticklabels(["Processing", "Wait"], fontsize=9, fontweight="bold")
    ax.tick_params(axis="y", length=0)
    ax.set_xlim(-.65, x+.25)
    ax.set_ylim(-.18, 1.7)

    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.get_xaxis().set_visible(False)

    ax.text(
        0, 1.57, title,
        ha="left", va="top",
        fontsize=12, fontweight="bold"
    )


def stage_totals(processes):
    return {
        "name": processes["name"],
        "ct": sum(float(p["ct"]) for p in processes["processes"]),
        "mt": sum(float(p["mt"]) for p in processes["processes"]),
    }


def validate(data):
    required_top = [
        "supplier", "purchasing", "sales", "customer",
        "production_control", "single_batch",
        "stages", "final_process", "product"
    ]

    top = data["top_hierarchy"]
    missing = [x for x in required_top if x not in top]
    if missing:
        raise ValueError("Missing top_hierarchy fields: " + ", ".join(missing))

    if len(data.get("connections", [])) == 0:
        raise ValueError("At least one workflow connection is required.")

    for stage in data["stages"]:
        if "name" not in stage or "inventory" not in stage:
            raise ValueError(
                "Every stage needs name and inventory: " + str(stage)
            )
        if not stage.get("processes"):
            raise ValueError(
                f"Stage '{stage['name']}' has no processes."
            )

        for p in stage["processes"]:
            for k in ("name", "ct", "mt", "ut", "st", "op", "scrap", "rft"):
                if k not in p:
                    raise ValueError(
                        f"Process '{p.get('name','?')}' is missing '{k}'."
                    )


def draw_top_hierarchy(pdf, data):
    top = data["top_hierarchy"]

    fig = plt.figure(figsize=(16.5, 11.7), dpi=300)
    ax = fig.add_axes([.025, .31, .95, .64])
    ax.axis("off")
    ax.set_xlim(0, 17)
    ax.set_ylim(0, 10)

    ax.text(
        8.5, 9.55,
        f"{top['product']} — TOP HIERARCHY VALUE STREAM MAP",
        ha="center", fontsize=19, fontweight="bold"
    )

    # Fixed reference layout. The workflow connections themselves come from JSON.
    nodes = {
        top["supplier"]: (.35, 8.0, 1.8, .72, BLUE),
        top["purchasing"]: (2.8, 8.0, 1.8, .72, BLUE),
        top["sales"]: (8.0, 8.15, 1.8, .72, BLUE),
        top["customer"]: (12.1, 8.15, 1.95, .72, BLUE),
        top["production_control"]: (7.45, 6.75, 2.55, .72, BLUE),
        top["single_batch"]: (5.0, 5.35, 5.0, .62, BLUE),
        top["final_process"]: (6.3, .45, 3.0, .72, BLUE),
        top["product"]: (10.7, .45, 1.9, .72, QUALITY),
    }

    # Stage boxes are placed automatically across the two branch rows.
    stage_positions = [
        (1.0, 3.65, 2.15, .72),
        (4.1, 1.95, 2.15, .72),
        (9.9, 3.65, 2.25, .72),
        (10.0, 1.95, 2.25, .72),
    ]

    for i, stage in enumerate(top["stages"]):
        stage_name = stage["name"] if isinstance(stage, dict) else str(stage)
        x, y, w, h = stage_positions[i % len(stage_positions)]
        color = PACKAGE if "package" in stage_name.lower() else (
            BLUE if "assembly" in stage_name.lower() else PROCESS_BLUE
        )
        nodes[stage_name] = (x, y, w, h, color)

    for label, (x, y, w, h, color) in nodes.items():
        ax.add_patch(Rectangle(
            (x, y), w, h,
            facecolor=color, edgecolor=BLACK, linewidth=.8
        ))
        ax.text(
            x+w/2, y+h/2, wrap(label, 22),
            ha="center", va="center", fontsize=8,
            color=BLACK if color == QUALITY else WHITE,
            fontweight="bold"
        )

    centers = {
        label: (x, y, w, h)
        for label, (x, y, w, h, _) in nodes.items()
    }

    def edge_point(label, side):
        x, y, w, h = centers[label]
        return {
            "left": (x, y+h/2),
            "right": (x+w, y+h/2),
            "top": (x+w/2, y+h),
            "bottom": (x+w/2, y)
        }[side]

    # Draw every workflow connection supplied by the user.
    # Sales <-> Customer is therefore naturally bidirectional when both
    # connections are included in JSON.
    for conn in data["connections"]:
        if len(conn) != 2:
            continue
        a, b = conn
        if a not in centers or b not in centers:
            raise ValueError(f"Unknown workflow node: {a} -> {b}")

        ax1, ay1, aw, ah = centers[a]
        bx1, by1, bw, bh = centers[b]

        if abs((ax1+aw/2)-(bx1+bw/2)) > abs((ay1+ah/2)-(by1+bh/2)):
            start = edge_point(a, "right" if bx1 > ax1 else "left")
            end = edge_point(b, "left" if bx1 > ax1 else "right")
        else:
            start = edge_point(a, "top" if by1 > ay1 else "bottom")
            end = edge_point(b, "bottom" if by1 > ay1 else "top")

        # Main information flow is blue; production branches are black.
        color = INV_BLUE if (
            a in {
                top["supplier"], top["purchasing"],
                top["sales"], top["customer"],
                top["production_control"], top["single_batch"]
            } or b in {
                top["supplier"], top["purchasing"],
                top["sales"], top["customer"],
                top["production_control"], top["single_batch"]
            }
        ) else BLACK

        arrow(ax, start, end, color, 2.5 if color == INV_BLUE else 1.5)

    # Inventory triangles are attached to stages using the explicit
    # stage inventory supplied in JSON.
    # Draw explicit stage-entry inventory values.
    for stage in top["stages"]:
        if isinstance(stage, dict):
            label = stage["name"]
            x, y, w, h, _ = nodes[label]
            triangle(ax, x+w+.45, y+h/2, stage["inventory"])

    summaries = []
    for stage in data["stages"]:
        summaries.append(stage_totals(stage))

    tl = fig.add_axes([.025, .06, .95, .20])
    wave_timeline(tl, summaries, "TOP HIERARCHY — TIME LINE")

    pdf.savefig(fig, bbox_inches="tight", dpi=300)
    plt.close(fig)


def draw_subassembly(pdf, stage):
    processes = stage["processes"]
    n = len(processes)

    W = max(16.5, n*1.45+1)
    fig = plt.figure(figsize=(W, 11.7), dpi=300)

    ax = fig.add_axes([.012, .42, .976, .53])
    ax.axis("off")
    ax.set_xlim(0, W)
    ax.set_ylim(0, 6)

    color = PACKAGE if "package" in stage["name"].lower() else (
        BLUE if "assembly" in stage["name"].lower()
        else PROCESS_BLUE
    )

    ax.add_patch(Rectangle(
        (.25, 5.35), W-.5, .48,
        facecolor=color, edgecolor=BLACK
    ))
    ax.text(
        W/2, 5.59,
        f"{stage['name']} — PROCESS VSM",
        ha="center", va="center",
        fontsize=13, color=WHITE, fontweight="bold"
    )

    gap = (W-.7)/n
    bw = min(1.08, gap*.68)

    for i, p in enumerate(processes):
        x = .25 + i*gap
        col = QUALITY if is_quality(p["name"]) else color
        tc = BLACK if col == QUALITY else WHITE

        ax.add_patch(Rectangle(
            (x, 3.52), bw, .64,
            facecolor=col, edgecolor=BLACK, linewidth=.8
        ))
        ax.text(
            x+bw/2, 3.84,
            wrap(p["name"]),
            ha="center", va="center",
            fontsize=6, color=tc, fontweight="bold"
        )

        if i < n-1:
            arrow(
                ax,
                (x+bw, 3.84),
                (x+gap, 3.84),
                BLACK, 1.2, 8
            )

        process_table(ax, x, 2.05, p)

        # Explicit inventory after this process if supplied.
        if "inventory_after" in p:
            triangle(ax, x+bw+(gap-bw)/2, 3.84, p["inventory_after"])

    # Starting inventory for the stage.
    triangle(ax, .25-.45, 3.84, stage["inventory"])

    tl = fig.add_axes([.012, .07, .976, .22])
    wave_timeline(tl, processes, f"{stage['name']} — TIME LINE")

    pdf.savefig(fig, bbox_inches="tight", dpi=300)
    plt.close(fig)


def main():
    with INPUT.open("r", encoding="utf-8") as f:
        data = json.load(f)

    validate(data)

    with PdfPages(OUTPUT, metadata={
        "Title": f"{data['top_hierarchy']['product']} VSM",
        "Author": "Manual VSM Generator",
        "Subject": "User supplied VSM workflow and process data"
    }) as pdf:
        draw_top_hierarchy(pdf, data)
        for stage in data["stages"]:
            draw_subassembly(pdf, stage)

    print(f"Generated: {OUTPUT}")


if __name__ == "__main__":
    main()
