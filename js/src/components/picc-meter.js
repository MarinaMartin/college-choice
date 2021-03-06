var CLASS_PREFIX = 'picc-meter-';

window.PICCMeter = document.registerElement('picc-meter', {
  prototype: Object.create(
    HTMLElement.prototype,
    {

      attachedCallback: {value: function() {
        this.min = getAttr(this, 'min', 0);
        this.max = getAttr(this, 'max', 1);
        this.value = getAttr(this, 'value');
        this.average = getAttr(this, 'average');

        this.update();
      }},

      attributeChangedCallback: {value: function(attr, prev, value) {
        // pass through attribute settings to
        // properties for min, max, value an
        // average
        switch (attr) {
          case 'min':
          case 'max':
          case 'value':
          case 'average':
            this[attr] = value;
            return;
        }
      }},

      update: {value: function() {
        var min = this.min;
        var max = this.max;
        var value = this.value;
        var average = this.average;

        var bar = getBar(this);
        var line = getLine(this);

        if (typeof value !== 'number' || isNaN(value)) {
          // console.log('bad value:', value);

          // reset the bar
          bar.style.setProperty('display', 'none');
          bar.style.removeProperty('height');

          // reset the line
          line.style.setProperty('display', 'none');
          line.style.removeProperty('bottom');

          // classify and bail
          classify(this, {
            'no_data': true,
            'above_average': false,
            'below_average': false,
            'about_average': false
          });

        } else {

          classify(this, {no_data: false});

          var scale = function(v) {
            return (v - min) / (max - min);
          };

          var percent = function(v) {
            return (scale(v) * 100).toFixed(1) + '%';
          };

          bar.style.removeProperty('display');
          // prevent the bar from exceeding the height
          bar.style.setProperty('height', percent(Math.min(value, max)));

          if (this.hasAttribute('average-range')) {
            var range = this.getAttribute('average-range');
            var numbers = range.split('..').map(Number);
            if (numbers.some(isNaN)) {
              console.warn('invalid average-range:', range, numbers);
              classify(this, {
                'above_average': false,
                'below_average': false,
                'about_average': false
              });
            } else {
              var lo = numbers[0];
              var hi = numbers[1];
              classify(this, {
                'above_average': value > hi,
                'below_average': value < lo,
                'about_average': value >= lo && value <= hi
              });
            }
          } else {
            classify(this, {
              'above_average': false,
              'below_average': false,
              'about_average': false
            });
          }

          if (isNaN(average)) {
            line.style.setProperty('display', 'none');
          } else {
            line.style.removeProperty('display');
            line.style.setProperty('bottom', percent(average));
          }

        }

        delete this.__timeout;

        this.dispatchEvent(new CustomEvent('update'));
      }},

      min: {
        get: function() {
          return this.__min;
        },
        set: function(value) {
          this.__min = number(value, 0);
          deferUpdate(this);
        }
      },

      max: {
        get: function() {
          return this.__max;
        },
        set: function(value) {
          this.__max = number(value, 1);
          deferUpdate(this);
        }
      },

      value: {
        get: function() {
          return this.__value;
        },
        set: function(value) {
          this.__value = number(value);
          deferUpdate(this);
        }
      },

      average: {
        get: function() {
          return this.__average;
        },
        set: function(value) {
          this.__average = number(value);
          deferUpdate(this);
        }
      }
    }
  )
});

function deferUpdate(meter, delay) {
  if (!delay) delay = 50;
  if (!meter.__timeout) {
    meter.__timeout = setTimeout(function() {
      delete meter.__timeout;
      meter.update();
    }, delay);
  }
}

function getAttr(node, attr, fallback) {
  return node.hasAttribute(attr)
    ? node.getAttribute(attr) || fallback
    : fallback;
}

function getBar(meter) {
  var bar = meter.querySelector('.' + CLASS_PREFIX + 'bar');
  if (!bar) {
    bar = meter.appendChild(document.createElement('div'));
    bar.className = CLASS_PREFIX + 'bar';
  }
  return bar;
}

function getLine(meter) {
  var line = meter.querySelector('.' + CLASS_PREFIX + 'line');
  if (!line) {
    line = meter.appendChild(document.createElement('div'));
    line.className = CLASS_PREFIX + 'line';
    line.appendChild(document.createElement('span'))
      .setAttribute('class', 'label');
  }
  return line;
}

function number(value, fallback) {
  var num = String(value).length ? +value : NaN;
  // console.log('number(', value, ') ->', num);
  if (arguments.length < 2) fallback = NaN;
  return isNaN(num) ? fallback : num;
}

function classify(el, classes) {
  for (var klass in classes) {
    el.classList[classes[klass] ? 'add' : 'remove'](klass);
  }
}
