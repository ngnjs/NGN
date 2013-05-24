module JsDuck

  # Creates an array of small hashes documenting name, parent class
  # and icon of a class.
  class Icons
    def create(classes)
      classes.map do |cls|
        {
          :name => cls[:name],
          :extends => cls[:extends],
          :private => cls[:private],
          :icon => Icons::class_icon(cls),
        }
      end
    end

    # Returns CSS class name for an icon of class
    def self.class_icon(cls)
      # Add node icon
      if cls.inherits_from?("node")
        "icon-node"
      elsif cls.inherits_from?("functionlib")
        "icon-functionlib"
      elsif cls[:singleton]
        "icon-singleton"
      elsif cls.inherits_from?("Ext.Component")
        "icon-component"
      else
        "icon-class"

      end
    end
  end

end
