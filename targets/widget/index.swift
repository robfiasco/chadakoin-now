import WidgetKit
import SwiftUI

// MARK: - Hex Color

extension Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var n: UInt64 = 0
        Scanner(string: h).scanHexInt64(&n)
        self.init(
            red:   Double((n >> 16) & 0xFF) / 255,
            green: Double((n >> 8)  & 0xFF) / 255,
            blue:  Double(n         & 0xFF) / 255
        )
    }
}

// MARK: - Theme

private let themeAccents: [String: String] = [
    "green":     "#00d4ff",
    "solar":     "#f0e0b0",
    "dahlstrom": "#5ba8d4",
    "violet":    "#c490ff",
    "crescent":  "#f0f0f0",
    "aldos":     "#ffd060",
    "swede":     "#FFDB00",
    "lake":      "#c8dff0",
    "niteline":  "#ffffff",
]

private let sharedDefaults = UserDefaults(suiteName: "group.com.chadakoindigital.chadakoinnow")

private var accent: Color {
    let id = sharedDefaults?.string(forKey: "theme_id") ?? "green"
    return Color(hex: themeAccents[id] ?? "#00d4ff")
}

// MARK: - Data

struct ParkingInfo {
    let side: String
    let detail: String

    static func current(for date: Date = Date()) -> ParkingInfo {
        let cal      = Calendar.current
        let day      = cal.component(.day,   from: date)
        let month    = cal.component(.month, from: date)
        let isWinter = month >= 11 || month <= 3
        return isWinter
            ? ParkingInfo(side: day % 2 == 0 ? "EVEN" : "ODD", detail: "Move by 10 AM")
            : ParkingInfo(side: month % 2 == 0 ? "EVEN" : "ODD", detail: "All month")
    }
}

struct RecyclingInfo {
    let material:  String
    let dateRange: String
    let emoji:     String

    static func current() -> RecyclingInfo {
        RecyclingInfo(
            material:  sharedDefaults?.string(forKey: "recycling_material")  ?? "—",
            dateRange: sharedDefaults?.string(forKey: "recycling_dateRange") ?? "—",
            emoji:     sharedDefaults?.string(forKey: "recycling_emoji")     ?? "♻️"
        )
    }
}

// MARK: - Timeline

struct ChadakoinEntry: TimelineEntry {
    let date:      Date
    let parking:   ParkingInfo
    let recycling: RecyclingInfo
}

struct ChadakoinProvider: TimelineProvider {
    func placeholder(in context: Context) -> ChadakoinEntry {
        ChadakoinEntry(date: Date(), parking: .current(), recycling: .current())
    }
    func getSnapshot(in context: Context, completion: @escaping (ChadakoinEntry) -> Void) {
        completion(ChadakoinEntry(date: Date(), parking: .current(), recycling: .current()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ChadakoinEntry>) -> Void) {
        let now      = Date()
        let entry    = ChadakoinEntry(date: now, parking: .current(for: now), recycling: .current())
        let cal      = Calendar.current
        let tomorrow = cal.startOfDay(for: cal.date(byAdding: .day, value: 1, to: now)!)
        completion(Timeline(entries: [entry], policy: .after(tomorrow)))
    }
}

// MARK: - Palette

private let dimGray = Color.white.opacity(0.30)

// Dark glass background — deep blue-slate base with a strong top-highlight and teal center glow
private struct GlassBackground: View {
    var body: some View {
        ZStack {
            Color(hex: "#08111d")
            // Blue-teal radial glow from center
            RadialGradient(
                colors: [Color(hex: "#00aace").opacity(0.09), Color.clear],
                center: .center,
                startRadius: 5,
                endRadius: 100
            )
            // Strong top-edge highlight for glass feel
            LinearGradient(
                colors: [Color.white.opacity(0.22), Color.white.opacity(0.05), Color.clear],
                startPoint: .top,
                endPoint: UnitPoint(x: 0.5, y: 0.52)
            )
            // Subtle bottom darkening
            LinearGradient(
                colors: [Color.clear, Color.black.opacity(0.28)],
                startPoint: UnitPoint(x: 0.5, y: 0.55),
                endPoint: .bottom
            )
        }
    }
}

// Gradient for EVEN/ODD — cyan left to mint right
private let parkingGradient = LinearGradient(
    colors: [Color(hex: "#38bdf8"), Color(hex: "#34d399")],
    startPoint: .leading,
    endPoint: .trailing
)

// Reusable pill badge
private struct PillBadge: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .medium))
            .foregroundColor(.white.opacity(0.70))
            .padding(.horizontal, 12)
            .padding(.vertical, 5)
            .background(Capsule().fill(Color.white.opacity(0.12)))
            .lineLimit(1)
    }
}

// MARK: - Parking small

struct ParkingSmallView: View {
    let entry: ChadakoinEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("PARKING")
                .font(.system(size: 8, weight: .semibold))
                .foregroundColor(dimGray)
                .kerning(1.5)

            Spacer()

            Text(entry.parking.side)
                .font(.system(size: 58, weight: .black))
                .minimumScaleFactor(0.3)
                .lineLimit(1)
                .foregroundStyle(parkingGradient)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text("SIDE")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.white)
                .kerning(1.5)
                .padding(.top, 1)

            Spacer()

            PillBadge(text: entry.parking.detail)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Recycling small

struct RecyclingSmallView: View {
    let entry: ChadakoinEntry

    // Strip parenthetical: "Paper (newspaper, magazines)" → "Paper"
    private var shortMaterial: String {
        let raw = entry.recycling.material
        if raw.contains("Cardboard") || raw.contains("Boxboard") { return "Cardboard" }
        if raw.contains("Plastic")                                { return "Plastics" }
        if raw.contains("Paper")                                  { return "Paper" }
        if raw.contains("Metal") || raw.contains("Can")           { return "Metal & Cans" }
        if raw.contains("Glass")                                  { return "Glass" }
        return raw.components(separatedBy: " (").first ?? raw
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("RECYCLING")
                .font(.system(size: 8, weight: .semibold))
                .foregroundColor(dimGray)
                .kerning(1.5)

            Spacer()

            Text(entry.recycling.emoji)
                .font(.system(size: 54))
                .frame(maxWidth: .infinity, alignment: .center)

            Text(shortMaterial)
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.65)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 4)

            Spacer()

            PillBadge(text: entry.recycling.dateRange)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Combined medium

struct CombinedMediumView: View {
    let entry: ChadakoinEntry

    private var shortMaterial: String {
        let raw = entry.recycling.material
        if raw.contains("Cardboard") || raw.contains("Boxboard") { return "Cardboard" }
        if raw.contains("Plastic")                                { return "Plastics" }
        if raw.contains("Paper")                                  { return "Paper" }
        if raw.contains("Metal") || raw.contains("Can")           { return "Metal & Cans" }
        if raw.contains("Glass")                                  { return "Glass" }
        return raw.components(separatedBy: " (").first ?? raw
    }

    var body: some View {
        HStack(alignment: .top, spacing: 0) {

            // Parking column
            VStack(alignment: .leading, spacing: 0) {
                Text("PARKING")
                    .font(.system(size: 8, weight: .semibold))
                    .foregroundColor(dimGray)
                    .kerning(1.5)

                Spacer()

                Text(entry.parking.side)
                    .font(.system(size: 46, weight: .black))
                    .minimumScaleFactor(0.3)
                    .lineLimit(1)
                    .foregroundStyle(parkingGradient)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Text("SIDE")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
                    .kerning(1.5)
                    .padding(.top, 1)

                Spacer()

                PillBadge(text: entry.parking.detail)
            }
            .padding(14)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

            Rectangle()
                .fill(Color.white.opacity(0.07))
                .frame(width: 1)
                .padding(.vertical, 10)

            // Recycling column
            VStack(alignment: .leading, spacing: 0) {
                Text("RECYCLING")
                    .font(.system(size: 8, weight: .semibold))
                    .foregroundColor(dimGray)
                    .kerning(1.5)

                Spacer()

                Text(entry.recycling.emoji)
                    .font(.system(size: 40))
                    .frame(maxWidth: .infinity, alignment: .center)

                Text(shortMaterial)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .minimumScaleFactor(0.65)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 3)

                Spacer()

                PillBadge(text: entry.recycling.dateRange)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .padding(14)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widgets

struct ParkingWidget: Widget {
    let kind = "ParkingWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ChadakoinProvider()) { entry in
            ParkingSmallView(entry: entry)
                .containerBackground(for: .widget) { GlassBackground() }
        }
        .configurationDisplayName("Parking Side")
        .description("Today's alternate side parking rule.")
        .supportedFamilies([.systemSmall])
    }
}

struct RecyclingWidget: Widget {
    let kind = "RecyclingWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ChadakoinProvider()) { entry in
            RecyclingSmallView(entry: entry)
                .containerBackground(for: .widget) { GlassBackground() }
        }
        .configurationDisplayName("Recycling")
        .description("This week's recycling pickup.")
        .supportedFamilies([.systemSmall])
    }
}

struct CombinedWidget: Widget {
    let kind = "CombinedWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ChadakoinProvider()) { entry in
            CombinedMediumView(entry: entry)
                .containerBackground(for: .widget) { GlassBackground() }
        }
        .configurationDisplayName("Parking + Recycling")
        .description("Today's parking side and this week's recycling.")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Bundle

@main
struct ChadakoinWidgetBundle: WidgetBundle {
    var body: some Widget {
        ParkingWidget()
        RecyclingWidget()
        CombinedWidget()
    }
}
