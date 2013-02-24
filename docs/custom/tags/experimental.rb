require "jsduck/meta_tag"

module JsDuck::Tag
  # Implementation of @experimental tag
  class Experimental < JsDuck::MetaTag
    def initialize
      @name = "experimental"
      @key = :experimental
      @signature = {:long => "experimental", :short => "EXP"}
      @multiline = false
      @position = :top
    end

    def to_html(context)
      <<-EOHTML
        <p style='color:#CCCCCC !important;border:2px dashed #eee;font-size:200%;padding:12px;border-radius:6px;margin-bottom:12px;'>
        This is an experimental feature that is not officially supported (yet).
        </p>
      EOHTML
    end
  end
end