import ExpoModulesCore
import WidgetKit

public class WidgetReloadModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetReload")

    Function("reloadAllTimelines") {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
