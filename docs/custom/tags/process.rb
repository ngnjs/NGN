require "jsduck/meta_tag"

module JsDuck::Tag
  # Implementation of @experimental tag
  class Process < JsDuck::MetaTag
    def initialize
      @name = "process"
      @key = :process
      @signature = {:long => "process", :short => "PROC"}
      @multiline = false
    end

    def to_html(context)
      <<-EOHTML
        <div class='signature-box'>
        <p>This feature is only available for NGN Processes.</p>
        </div>
      EOHTML
    end
  end
end