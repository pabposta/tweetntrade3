from datetime import datetime, timedelta, date

class Time(object):
    @staticmethod
    def current_time():
        now = datetime.utcnow()
        now_in_minutes = datetime(now.year, now.month, now.day, now.hour, now.minute, 0, 0, now.tzinfo)
        return now_in_minutes

    @classmethod
    def seconds_ago(cls, seconds):
        now = cls.current_time()
        ago = now - timedelta(seconds=seconds)
        return ago

    @staticmethod
    def is_holiday(day):
        is_weekday = day.weekday < 5
        return is_weekday

    @classmethod
    def today_is_holiday(cls):
        today = date.today()
        return cls.is_holiday(today)