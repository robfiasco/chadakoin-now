Pod::Spec.new do |s|
  s.name           = 'WidgetReload'
  s.version        = '1.0.0'
  s.summary        = 'Triggers a WidgetKit timeline reload from JS'
  s.description    = 'Triggers a WidgetKit timeline reload from JS'
  s.license        = 'MIT'
  s.author         = 'Chadakoin Now'
  s.homepage       = 'https://chadakoin-now.vercel.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/robfiasco/chadakoin-now' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
end
