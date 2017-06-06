function Calendar(el, options) {
  this.wrapper = document.getElementById(el);
  this.wrapper.classList.add('pulldown');
  this.calendarList = this.createElement('div', {
    "class": "calendar-list"
  });

  var date = new Date();
  this.past = false;
  this.state = 0;  //0为折叠状态 1为正在拉开状态 2为展开状态
  this.hours = false;
  this.hoursPast = false;
  this.currentNode = null;
  this.minDate = null;
  this.maxDate = null;
  this.shield = '[]';
  this.startDate = '';
  this.foldJSON = {};
  this.unfoldJSON = {};
  this.activeJSON = {};
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
  this.moveStatus = 0;
  this.maxY = 210;
  this.minY = 40;
  this.questionData = [];
  this.init();
}

Calendar.prototype = {
  version: "0.0.1",
  init: function () {
    var self = this;
    this.createHeader();
    this.wrapper.appendChild(self.calendarList);
    this.initFoldList();
    self.currentNode = this;
  },
  refresh: function (data) {
    for (var key in data) {
      this.questionData.push(key);
    }
    this.appendFoldList(this.foldJSON, this.addEvent.bind(this));
  },
  /**
   * 创建头部
   */
  createHeader: function () {
    var date = new Date();
    var month = this.createElement('div', {
      "class": "calendar-title"
    });
    this.wrapper.appendChild(month);
    this.setDateTitle(date.getFullYear(), date.getMonth());

    var week = this.createElement('div', {
      "class": "calendar-week"
    });
    var weeks = "日一二三四五六";
    for (var i = 0; i < 7; i++) {
      var n = i + 1;
      var day = this.createElement('span', {}, "周" + weeks.charAt(i));
      week.appendChild(day)
    }
    this.wrapper.appendChild(week);
  },
  /**
   * 初始化折叠列表
   */
  initFoldList: function () {
    var self = this;
    var date = new Date();
    var currentMonth = self.relativeMonth = date.getMonth() + 1;
    var currentYear = self.relativeYear = date.getFullYear();
    var curDate = date.getDate() - date.getDay();
    self.activeJSON = {
      y: currentYear,
      m: currentMonth,
      d: date.getDate()
    }
    var prev = this.getDayData(curDate - 7, currentMonth, currentYear);
    var now = this.getDayData(curDate, currentMonth, currentYear);
    var next = this.getDayData(curDate + 7, currentMonth, currentYear);

    self.foldJSON.prev = prev;
    self.foldJSON.now = now;
    self.foldJSON.next = next;
    //增加日历节点
    self.appendFoldList(self.foldJSON, self.addEvent.bind(self));
    //设置今天为active
    var dateValue = $('.today').attr('data-calen');
    if (typeof self.options.callback === 'function') {
      self.options.callback(dateValue);
    }
    self.documentSwitch();
  },
  /**
   * 插入折叠的日历对象
   */
  appendFoldList: function (data, callback) {
    var self = this;
    this.calendarList.innerHTML = '';
    this.calendarList.appendChild(this.createFoldList(data.prev, "prev"));
    this.calendarList.appendChild(this.createFoldList(data.now, "now"));
    this.calendarList.appendChild(this.createFoldList(data.next, "next"));
    callback && callback();
  },
  //创建折叠列表
  createFoldList: function (data, setTitle) {
    var self = this;
    var oList = this.createElement('div');
    if (setTitle === 'now') {
      self.setDateTitle(self.activeJSON.y, self.activeJSON.m - 1);
      oList.classList.add('now-box');
    } else if (setTitle === 'prev') {
      oList.classList.add('prev-box');
    } else if (setTitle === 'next') {
      oList.classList.add('next-box');
    }
    var newDate = new Date(data.y, data.m, 1);
    newDate.setDate(0);
    var totalDay = newDate.getDate();
    var curDate = new Date();
    for (var i = 0; i < 7; i++) {
      var day = data.d + i;
      var month = data.m;
      var year = data.y;
      if (day > totalDay) {
        day -= totalDay;
        month += 1;
        if (month > 12) {
          year += 1;
        }
      }
      var nnDate = new Date(year, month, day);
      var spanEle = self.createElement('span');
      var dataStr = [year, month, day].join('/');
      var aEle = self.createElement('a', {
        "data-calen": dataStr
      }, day);
      if (curDate.getFullYear() === year
        && curDate.getMonth() + 1 === month
        && curDate.getDate() === day) {
        aEle.classList.add('today');
      }
      if (year === self.activeJSON.y
        && month === self.activeJSON.m
        && day === self.activeJSON.d) {
        aEle.classList.add('active');
      }
      for (var j = 0; j < self.questionData.length; j++) {
        if (self.questionData[j] === dataStr) {
          aEle.classList.add('has-question');
          break;
        }
      }
      spanEle.appendChild(aEle);
      oList.appendChild(spanEle);
    }
    return oList;
  },
  /**
   * 创建展开列表
   */
  initUnfoldList: function () {
    var self = this;
    self.setUnfoldJson(self.activeJSON.y, self.activeJSON.m);
    self.appendUnfoldList(self.unfoldJSON, self.addEvent.bind(self));
  },
  setUnfoldJson: function (curYear, curMonth) {
    var self = this;
    if (curMonth <= 0) {
      curMonth = 12;
      curYear--;
    }
    if (curMonth > 12) {
      curMonth = 1;
      curYear += 1;
    }
    self.activeJSON.m = curMonth;
    self.activeJSON.y = curYear;
    var prevMonth = curMonth - 1;
    var nextMonth = curMonth + 1;
    var prevYear = nextYear = curYear;
    if (prevMonth <= 0) {
      prevMonth = 12;
      prevYear--;
    }
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    self.unfoldJSON.prev = {
      y: prevYear,
      m: prevMonth
    }
    self.unfoldJSON.now = {
      y: curYear,
      m: curMonth,
    }
    self.unfoldJSON.next = {
      y: nextYear,
      m: nextMonth
    }
  },
  /**
   * 插入展开的日历对象 
   */
  appendUnfoldList: function (data, callback) {
    this.calendarList.innerHTML = '';
    this.relativeMonth = data.now.m;
    this.relativeYear = data.now.y;

    this.calendarList.appendChild(this.createCalenList(data.prev, "prev"));
    this.calendarList.appendChild(this.createCalenList(data.now, "now"));
    this.calendarList.appendChild(this.createCalenList(data.next, "next"));

    callback && callback();
  },
  /**
   * 创建日历列表
   */
  createCalenList: function (data, setTitle) {
    var self = this;
    var oList = this.createElement('div');
    if (setTitle === 'now') {
      self.setDateTitle(data.y, data.m - 1);
      oList.classList.add('now-box');
    } else if (setTitle === 'prev') {
      oList.classList.add('prev-box');
    } else if (setTitle === 'next') {
      oList.classList.add('next-box');
    }
    var createdCount = 0;
    var prevM = data.m - 1;
    var prevY = data.y;
    var prevDate = new Date(prevY, prevM, 1);
    prevDate.setDate(0);
    var dSun = prevDate.getDate();

    var nowDate = new Date(data.y, data.m, 1);
    var curDay = nowDate.getDate();
    nowDate.setDate(0);
    var lastDay = nowDate.getDate();
    nowDate.setDate(1);
    var dWeek = nowDate.getDay();

    var curDate = new Date();
    var today = curDate.getDate();
    var curYear = curDate.getFullYear();
    var curMonth = curDate.getMonth() + 1;
    //创建上月尾部分
    
    
    for (var i = dSun - dWeek + 1; i <= dSun; i++) {
      var spanEle = this.createElement('span'),
        dayEle = this.createElement('a', {
          "data-calen": [prevY, prevM, i].join('/'),
          "class": "prev-m prev-to-month pasted",
          "href": "javascript:;"
        }, i);
      spanEle.appendChild(dayEle);
      oList.appendChild(spanEle);
      createdCount++;
    }
    //创建本月部分
    for (var i = 0; i < lastDay; i++) {
      createdCount++;
      var day = i + 1;
      var spanEle = this.createElement('span');
      var dataStr = [data.y, data.m, day].join('/');
      var dayEle = this.createElement('a', {
        "data-calen": dataStr,
        "href": 'javascript:;'
      }, day);
      if (
        data.y === curYear &&
        data.m === curMonth &&
        day === today
      ) {
        dayEle.classList.add('today');
      }
      if (day === 1) {
        dayEle.classList.add('first-day');
      }
      if (data.y === self.activeJSON.y
        && data.m === self.activeJSON.m
        && day === self.activeJSON.d) {
        dayEle.classList.add('active');
      }
      for (var j = 0; j < self.questionData.length; j++) {
        if (self.questionData[j] == dataStr) {
          dayEle.classList.add('has-question');
          break;
        }
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
        "data-calen": [data.y, data.m + 1, day].join('/'),
        "class": "next-m next-to-month pasted",
        "href": "javascript:;"
      }, day);
      spanEle.appendChild(dayEle);
      oList.appendChild(spanEle);
    }
    return oList;
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
  transitions: function (obj, dir, isFirst) {
    var self = this;
    obj.classList.add('slide', dir > 0 ? 'prev-to' : 'next-to');
    setTimeout(function end() {
      self.appendUnfoldList(self.unfoldJSON, function () {
        obj.classList.remove('slide', 'prev-to', 'next-to');
        self.addEvent();
        if (isFirst) {
          $('.now-box .active').removeClass('active');
          self.activeJSON = {};
          var activeEle = $('.now-box .first-day')[0];
          activeEle.classList.add('active');
          var str = activeEle.getAttribute('data-calen');
          var date = self.parseStrToDate(str);
          self.activeJSON = {
            y: date.y,
            m: date.m,
            d: date.d
          };
          if (typeof self.options.callback === 'function') {
            self.options.callback(str);
          }
        }
      })
    }, 500);
  },
  /**
   * 切换折叠日期动画
   */
  transitionsFold: function (obj, dir) {
    var self = this;
    obj.classList.add('slide', dir > 0 ? 'prev-to' : 'next-to');
    setTimeout(function end() {
      self.activeJSON = {
        y: self.foldJSON.now.y,
        m: self.foldJSON.now.m,
        d: self.foldJSON.now.d
      };
      self.appendFoldList(self.foldJSON, function () {
        obj.classList.remove('slide', 'prev-to', 'next-to');
        self.addEvent();
        $('.active').removeClass('active');
        var activeEle = $('.now-box span a')[0];
        activeEle.classList.add('active');
        var str = activeEle.getAttribute('data-calen');
        var date = self.parseStrToDate(str);
        if (typeof self.options.callback === 'function') {
          self.options.callback(str);
        }
      })
    }.bind(this), 500)
  },
  slideSwitch: function (obj, dir) {
    var self = this;
    if (self.state == 0) {
        var prev2 = {}, now2 = {}, next2 = {};
        if (dir > 0) {
          prev2 = self.getDayData(self.foldJSON.prev.d - 7, self.foldJSON.prev.m, self.foldJSON.prev.y);
          now2 = self.getDayData(self.foldJSON.now.d - 7, self.foldJSON.now.m, self.foldJSON.now.y);
          next2 = self.getDayData(self.foldJSON.next.d - 7, self.foldJSON.next.m, self.foldJSON.next.y);
        } else {
          prev2 = self.getDayData(self.foldJSON.prev.d + 7, self.foldJSON.prev.m, self.foldJSON.prev.y);
          now2 = self.getDayData(self.foldJSON.now.d + 7, self.foldJSON.now.m, self.foldJSON.now.y);
          next2 = self.getDayData(self.foldJSON.next.d + 7, self.foldJSON.next.m, self.foldJSON.next.y);
        }
        self.foldJSON.prev = prev2;
        self.foldJSON.now = now2;
        self.foldJSON.next = next2;
        self.transitionsFold(obj, dir);
      } else if (self.state == 2) {
        if (dir > 0) {
          self.setUnfoldJson(self.activeJSON.y, self.activeJSON.m - 1);
        } else {
          self.setUnfoldJson(self.activeJSON.y, self.activeJSON.m + 1);
        }
        self.transitions(obj, dir, true);
      }
  },
  documentSwitch: function () {
    this.wrapper.addEventListener('touchstart', start, false);
    this.wrapper.addEventListener('touchmove', move, false);
    this.wrapper.addEventListener('touchend', end, false);
    var needW = parseInt(document.documentElement.clientWidth / 6, 10);
    var startY, startX, offset = 20, maxY = 210, minY = 35;
    var self = this;
    function start(evt) {
      var e = evt.targetTouches ? evt.targetTouches[0] : evt;
      startY = e.pageY;
      startX = e.pageX;
    }
    function move(evt) {
      if (self.slideing) return;
      var e = evt.targetTouches ? evt.targetTouches[0] : evt;
      var distanceY = e.pageY - startY;
      var dir = e.pageX - startX;
      if ($(evt.target.closest('.calendar-list')).length > 0 && Math.abs(dir) >= needW && Math.abs(distanceY) < 10 && self.state != 1) {
          self.slideing = true;
          self.slideSwitch(self.calendarList, dir);
      }else if (distanceY > offset && self.state === 0) {
        self.state = 1;
        self.initUnfoldList();
        self.moveStatus = 1;
        self.moveUnfoldPage(210);
      } else if (distanceY > offset && self.state === 1 && self.moveStatus != 3) {
        self.moveStatus = 1;
        self.moveUnfoldPage(distanceY);
      } else if (distanceY < -offset && self.state === 2 && self.moveStatus != 3) {
        self.moveStatus = 2;
        self.moveFoldPage(distanceY);
      } 
      evt.preventDefault();
    }
    function end(evt) {
      var e = evt.targetTouches ? evt.targetTouches[0] : evt;
      if (self.moveStatus === 1 && self.state === 1) {
        self.turnToUnfold();
      } else if (self.moveStatus === 2 && self.state === 2) {
        self.turnToFold();
      }
      self.slideing = false;
    }
  },
  moveUnfoldPage: function (distanceY) {
    if (this.moveStatus == 3) return;
    distanceY = distanceY < 30 ? 30 : distanceY;
    $('.calendar-list').addClass('slide');
    var h = $('.calendar-list').height() + distanceY;
    this.wrapper.classList.remove('pulldown');
    if (h >= this.maxY) {
      this.turnToUnfold();
    } else {
      var ch = 92 + h;
      $('.calendar-list').css('height', h + 'px');
      $('#calendar-content').css('margin-top', ch + "px");
    }
  },
  moveFoldPage: function (distanceY) {
    if (this.moveStatus == 3) return;
    $('.calendar-list').addClass('slide');
    var h = $('.calendar-list').height() + distanceY;
    this.wrapper.classList.remove('pullup');
    var ch = 92 + h;
    if (h <= this.minY) {
      this.turnToFold();
    } else {
      $('.calendar-list').css('height', h + 'px');
      $('#calendar-content').css('margin-top', ch + "px");
    }
  },
  turnToFold: function () {
    $('.calendar-list').addClass('slide');
    this.moveStatus = 3;
    setTimeout(this.resetFold.bind(this), 500);
    $('.calendar-list').css('height', this.minY + 'px');
    $('#calendar-content').css('margin-top', "97px");
    this.wrapper.classList.add('pulldown');
  },
  turnToUnfold: function () {
    $('.calendar-list').addClass('slide');
    this.moveStatus = 3;
    $('.calendar-list').css('height', this.maxY + 'px');
    $('#calendar-content').css('margin-top', "267px");
    setTimeout(this.resetUnfold.bind(this), 500);
    this.wrapper.classList.add('pullup')
  },
  resetUnfold: function () {
    this.state = 2;
    this.moveStatus = 1;
  },
  resetFold: function () {
    var self = this;
    self.moveStatus = 1; 
    self.state = 0;
    var currentMonth = self.activeJSON.m;
    var currentYear = self.activeJSON.y;

    var date = new Date(currentYear, currentMonth - 1, self.activeJSON.d);
    var curDate = date.getDate() - date.getDay();
    var prev = self.getDayData(curDate - 7, currentMonth, currentYear);
    var now = self.getDayData(curDate, currentMonth, currentYear);
    var next = self.getDayData(curDate + 7, currentMonth, currentYear);
    self.foldJSON.prev = prev;
    self.foldJSON.now = now;
    self.foldJSON.next = next;
    self.appendFoldList(self.foldJSON, self.addEvent.bind(self));
  },
  /**
   * 更新月份和年份标题
   */
  setDateTitle: function (year, month) {
    var monthLabel = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
    $('.calendar-title').html(monthLabel[month] + '月' + year);
    this.relativeMonth = month + 1;
    this.relativeYear = year;

  },
  /**
   * 设置日历事件
   */
  addEvent: function () {
    var self = this;
    $('.calendar-list a').on('click', function (e) {
      $('.calendar-list a').removeClass('active');
      $(this).addClass('active');
      var str = $(this).attr('data-calen');
      self.activeJSON = self.parseStrToDate(str);
      if (typeof self.options.callback === 'function') {
        self.options.callback($(this).attr('data-calen'));
      }
      var curMonth = self.activeJSON.m;
      if (curMonth != self.relativeMonth) {
        if (self.state === 2) {
          var dir = curMonth > self.relativeMonth ? -1 : 1;
          self.setUnfoldJson(self.activeJSON.y, curMonth);
          self.transitions(self.calendarList, dir, false);
        } else if (self.state === 0) {
          self.setDateTitle(self.activeJSON.y, curMonth - 1);
        }
      }
    })
  },
  //转化为正确的日/月/年
  getDayData: function (d, m, y) {
    var date = d, month = m, year = y;
    var newDate = new Date(year, month, 1);
    newDate.setDate(0);
    var totalDay = newDate.getDate();
    if (date <= 0) {
      month -= 1;
      newDate = new Date(year, month, 1);
      newDate.setDate(0);
      date += newDate.getDate();
      if (month <= 0) {
        month = 12;
        year -= 1;
      }
    } else if (date > totalDay) {
      month += 1;
      date -= totalDay;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return {
      y: year,
      m: month,
      d: date
    }
  },
  /**
   * 获取时间戳
   */
  getTime: function (year, month, date) {
    if (year === undefined || month === undefined || date === undefined) return null;
    return (new Date(year, month, date, 23, 59, 59)).getTime();
  },
  parseStrToDate: function (str) {
    var attr = str.split('/');
    return {
      y: parseInt(attr[0]),
      m: parseInt(attr[1]),
      d: parseInt(attr[2])
    }
  },
  /**
   * 通过字符串获取年月日
   */
  getDate: function (str) {
    if (!str) return [];

    var dateList = [];
    if (/^\[|\]$/.test(str)) {
      dateList = JSON.parse(str.replace(/\'/g, '"'));
    } else if (/^\d+[\/-]\d+[\/-]\d+$/.test(str)) {
      dateList = [str];
    }
    return dateList.map(function (dateString) {
      var date = new Date(dateString + '23:59:59');
      return {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate()
      }
    })
  }
}