function Calendar(el, options) {
  this.wrapper = document.getElementById(el);
  this.calendarList = this.createElement('div', {
    "class": "calendar-list"
  });
  this.monthLabel = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
  var date = new Date();
  this.past = false;
  this.state = 0;
  this.hours = false;
  this.hoursPast = false;
  this.currentNode = null;
  this.minDate = null;
  this.maxDate = null;
  this.shield = '[]';
  this.startDate = '';
  this.startJSON = {};
  this.fixDate = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: 0
  }
  this.relativeMonth = 0;
  this.relativeYear = 0;
  this.slideing = false;
  this.options = {
    callback: "callback"
  }
  for (var key in options) {
    this.options[key] = options[key]
  }
  this.init();
}

Calendar.prototype = {
  version: "0.0.1",
  init: function () {
    var self = this;
    this.createHeader();
    this.wrapper.appendChild(self.calendarList);

    this.slideSwitch(self.calendarList, function (obj, dir) {
      dir > 0 ? self.relativeMonth-- : self.relativeMonth++;
      self.startJSON.prev.m = self.relativeMonth - 1;
      self.startJSON.now.m = self.relativeMonth;
      self.startJSON.next.m = self.relativeMonth + 1;
      self.transitions(obj, dir);
    });
    var start = Number(self.wrapper.getAttribute('start-year')) || 1915;
    var end = Number(self.wrapper.getAttribute('end-year')) | 2050;

    self.hours = !(self.wrapper.getAttribute('hours') == null);
    self.hoursPast = !(self.wrapper.getAttribute('hours-past') == null);
    self.past = !(self.wrapper.getAttribute('past') == null) || self.hoursPast;
    
    self.minDate = self.getDate(self.wrapper.getAttribute('min-date') || '')[0];
    self.maxDate = self.getDate(self.wrapper.getAttribute('max-date') || '')[0];

    self.startDate = self.getDate(self.wrapper.getAttribute('start-date') || '')[0];

    var prev, now, next, oDate = new Date();
    if (self.startDate instanceof Array && self.startDate.length) {
      var startDate = self.startDate[0];
      self.relativeYear = startDate.y - oDate.getFullYear();
      self.relativeMonth = startDate.m - (oDate.getMonth() + 1);

      for (var key in startDate) {
        self.fixDate[key] = startDate[key];
      }
      
      prev = {
        y: self.relativeYear,
        m: self.relativeMonth - 1,
        d: startDate.d
      };
      now = {
        y: self.relativeYear,
        m: self.relativeMonth,
        d: startDate.d
      };
      next = {
        y: self.relativeYear,
        m: self.relativeMonth + 1,
        d: startDate.d
      }
      self.startJSON = {
        prev: prev,
        now: now,
        next: next
      };
    } else {
      self.fixDate.y = oDate.getFullYear();
      self.fixDate.m = oDate.getMonth() + 1;
      self.fixDate.d = 0;
    }

    if (self.currentNode != this) {
      if (self.startDate instanceof Array || !self.startDate) {
        self.relativeYear = self.relativeMonth = 0;
        self.startJSON.prev = {
          y: self.relativeYear,
          m: self.relativeMonth - 1
        };
        self.startJSON.now = {
          y: self.relativeYear,
          m: self.relativeMonth
        };
        self.startJSON.next = {
          y: self.relativeYear,
          m: self.relativeMonth + 1
        };
      }
      // self.appendUnfoldList(self.startJSON, self.addEvent.bind(self));
    }
    self.currentNode = this;
  },
  /**
   * 创建头部
   */
  createHeader: function () {

    var date = new Date();
    var monthLabel = this.monthLabel[date.getMonth()] + "月" + date.getFullYear();
    var month = this.createElement('div', {
      "class": "calendar-title"
    }, monthLabel);
    this.wrapper.appendChild(month);

    var week = this.createElement('div', {
      "class": "calendar-week"
    });
    var weeks = "日一二三四五六";
    for (var i =0; i < 7; i++) {
      var n = i + 1;
      var day = this.createElement('span', {}, "周"+weeks.charAt(i));
      week.appendChild(day)
    }
    this.wrapper.appendChild(week);
  },
  /**
   * 创建日历列表
   */
  createCalenList: function (data, setTitle) {
    var self = this;
    var oList = this.createElement('div');
    var createdCount = 0;
    var mixinYear = data.y || 0;
    var mixinMonth = data.m || 0;
    var mixinDay = data.d || 0;
    var minDate = this.minDate || {};
    var maxDate = this.maxDate || {};

    var date = new Date();
    date.setFullYear(date.getFullYear() + mixinYear, (date.getMonth() + mixinMonth + 1), 1);
    date.setDate(0);

    var dSun = date.getDate();
    date.setDate(1);
    
    var dWeek = date.getDay();
    var date = new Date();
    var today = date.getDate();
    date.setFullYear(date.getFullYear() + mixinYear, date.getMonth() + mixinMonth, 1)

    var currentYear = date.getFullYear();
    var currentMonth = date.getMonth() + 1;
    if (setTitle) {
      var mon = date.getMonth();
      document.querySelector('.calendar-title').innerHTML = this.monthLabel[date.getMonth()] + "月" + currentYear
      
    }

    date.setDate(0);
    var lastDay = date.getDate();
    var lastMonths = [];

    for (var i = lastDay; i > 0; i--) {
      lastMonths.push(i)
    }
    //创建上月尾部分
    var lastMonthDay = dWeek;
    lastMonthDay = lastMonthDay >= 10 ? lastMonthDay - 7 : lastMonthDay;
    for (var i = 0; i < lastMonthDay; i++) {
      var spanEle = this.createElement('span'),
          dayEle = this.createElement('a', {
            "data-calen": [currentYear, currentMonth - 1, lastMonths[i]].join('/'),
            "class": "prev-m prev-to-month pasted",
            "href": "javascript:;"
          }, lastMonths[i]);
      spanEle.appendChild(dayEle);

      if (oList.children.length !== 0) {
        oList.insertBefore(spanEle, oList.children[0]);
      } else {
        oList.appendChild(spanEle);
      }
      createdCount++;
    }

    var nowTime = this.getTime(currentYear, currentMonth, today);
    var minDateTime = this.getTime(minDate.y, minDate.m, minDate.d);
    var maxDateTime = this.getTime(maxDate.y, maxDate.m, maxDate.d);
    //当前月的日期列表
    for (var i = 0; i < dSun; i++) {
      createdCount++;
      var day = i + 1;
      var spanEle = this.createElement('span');
      var dayEle = this.createElement('a', {
        "data-calen": [currentYear, currentMonth, day].join('/'),
        "href": 'javascript:;'
      }, day);

      //设置周末的样式
      // if (createdCount % 7 === 0 || createdCount % 7 === 1) {
      //   dayEle.classList.add('weekend');
      // }
      
      var time = this.getTime(mixinYear +　currentYear, mixinMonth + currentMonth, day);
      var contrastTime = this.getTime(currentYear, currentMonth, day)

      if (
        self.past && time < nowTIme ||
        minDateTime && contrastTime < minDateTime || 
        maxDateTime && contrastTime > maxDateTime) {
        dayEle.classList.add('expire', 'pasted');
      }

      if (
        time === nowTime || 
        self.fixDate.y === currentYear &&
        self.fixDate.m === currentMonth &&
        self.fixDate.d === day
      ) {
        dayEle.classList.add('today', 'active');
      }

      spanEle.appendChild(dayEle);
      oList.appendChild(spanEle);
    }

    //创建下月尾部分
    var nextMonths = 42 - oList.children.length;
    
    for (var i = 0; i < nextMonths; i++) {
      var day = i + 1;
      var spanEle = this.createElement('span');
      var dayEle = this.createElement('a', {
        "data-calen": [currentYear, currentMonth + 1, day].join('/'),
        "class": "next-m next-to-month pasted",
        "href": "javascript:;"
      }, day);
      spanEle.appendChild(dayEle);
      oList.appendChild(spanEle);
    }
    return oList;
  },
  /**
   * 创建时间
   */
  createTime: function (currentNode, date, today) {

  },
  /**
   * 插入折叠的日历对象
   */
  appendFoldList: function (data, callback) {
    data = data || {};
    data.prev = data.prev || {
      m: this.relativeMonth - 1,
      y: this.relativeYear
    };
    data.now = data.now || {
      m: this.relativeMonth,
      y: this.relativeYear
    };
    data.next = data.next || {
      m: this.relativeMonth + 1,
      y: this.relativeYear
    };
    this.calendarList.innerHTML = '';

    this.calendarList.appendChild(this.createCalenList(data.prev));
    this.calendarList.appendChild(this.createCalenList(data.now, true));
    this.calendarList.appendChild(this.createCalenList(data.next));
    callback && callback();
  },
  /**
   * 插入展开的日历对象 
   */
  appendUnfoldList: function (data, callback) {
    data = data || {};
    data.prev = data.prev || {
      m: this.relativeMonth - 1,
      y: this.relativeYear
    };
    data.now = data.now || {
      m: this.relativeMonth,
      y: this.relativeYear
    };
    data.next = data.next || {
      m: this.relativeMonth + 1,
      y: this.relativeYear
    };
    this.calendarList.innerHTML = '';

    this.calendarList.appendChild(this.createCalenList(data.prev));
    this.calendarList.appendChild(this.createCalenList(data.now, true));
    this.calendarList.appendChild(this.createCalenList(data.next));

    callback && callback();
  },
  /**
   * 创建dom节点，增加属性
   */
  createElement: function (tagName, attr, html) {
    if (!tagName) return;
    attr = attr || {};
    html = html || '';
    var element = document.createElement(tagName);
    for (var key in attr) {
      element.setAttribute(key, attr[key])
    }
    element.innerHTML = html;
    return element;
  },
  /**
   * 切换月份动画
   */
  transitions: function (obj, dir) {
    var self = this;
    obj.classList.add('slide', dir > 0 ? 'prev-to': 'next-to');
    setTimeout(function end () {
      this.appendUnfoldList(this.startJSON, function () {
        obj.classList.remove('slide', 'prev-to', 'next-to');
        self.addEvent();
      })
    }.bind(this), 500);
  },
  slideSwitch: function (element, callback) {
    element.onmousedown = start;
    element.removeEventListener('touchstart', start, false);
    element.addEventListener('touchstart', start, false);
    var prarent = this;
    function start (evt) {
      var oEv = evt.targetTouches ? evt.targetTouches[0] : evt;
      var disX = oEv.pageX;
      var needW = parseInt(document.documentElement.clientWidth / 5, 10);
      var dir;
      var self = this;
      function move (evt) {
        if (prarent.slideing) return false;
        var oEv = evt.targetTouches ? evt.targetTouches[0] : evt;
        dir = oEv.pageX - disX;
        if (Math.abs(dir) >= needW) {
          prarent.slideing = true;
          callback && callback(self, dir);
        }
        oEv.preventDefault && oEv.preventDefault();
        return false;
      }

      function end (evt) {
        this.onmousemove && (this.onmousemove = null);
        this.onmouseup && (this.onmouseup = null);

        this.removeEventListener('touchmove', move, false);
        this.removeEventListener('touchend', move, false);
        prarent.slideing = false;
        console.log(typeof prarent.options.callback == 'function');
        if(typeof prarent.options.callback == 'function') {
          prarent.options.callback(1);
        }
      }

      this.onmousemove = move;
      this.onmouseup = end;

      element.removeEventListener('touchmove', move, false);
      element.removeEventListener('touchend', end, false);

      element.addEventListener('touchmove', move, false);
      element.addEventListener('touchend', end, false);
    }
  },
  /**
   * 设置日历事件
   */
  addEvent: function () {
    var self = this;
    Array.prototype.forEach.call(self.calendarList.querySelectorAll('a'), function (node) {
      node.classList.remove('active');
      node.onclick = function () {
        removeActive();
        var dateValue = this.getAttribute('data-calen');
        this.classList.add('active');
        console.log(new Date(dateValue) - 0);
        // if (classList.contains('prev-to-month')) {

        // }
      }
    })
    function removeActive () {
      Array.prototype.forEach.call(self.calendarList.querySelectorAll('a'), function (node) {
        node.classList.remove('active');
      });
    }
  },
  /**
   * 获取时间戳
   */
  getTime: function(year, month, date) {
    if (year === undefined || month === undefined || date === undefined)  return null;
    return (new Date(year, month, date, 23, 59, 59)).getTime();
  },
  /**
   * 通过字符串获取年月日
   */
  getDate: function (str) {
    if (!str) return [];

    var  dateList = [];
    if (/^\[|\]$/.test(str)) {
      dateList = JSON.parse(str.replace(/\'/g, '"'));
    } else if (/^\d+[\/-]\d+[\/-]\d+$/.test(str)) {
      dateList = [str];
    }
    return dateList.map(function(dateString) {
      var date = new Date(dateString + '23:59:59');
      return {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate()
      }
    })
  }
}