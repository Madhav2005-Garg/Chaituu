from datetime import datetime

######## START CONTENT ########

class EOT():
	#RETURNS the current time as a stardate with 8 decimal point precision.
	@staticmethod
	def GetStardate():
		now = datetime.utcnow()
		year = now.year
		day_of_year = now.timetuple().tm_yday
		hour = now.hour
		minute = now.minute
		second = now.microsecond / 1000000

		one_hour = 1 / 24 / 365
		one_minute = one_hour / 60
		one_second = one_minute / 60

		exact_day = (day_of_year / 365)
		exact_hour = hour * one_hour
		exact_minute = minute * one_minute
		exact_second = second * one_second
		exact_decimal = exact_day + exact_hour + exact_minute + exact_second
		decimal = float('%.12f' % (exact_decimal))
		# error = decimal * 365 - day_of_year - (hour / 24)
		# error_hours = error * 24
		stardate = format(year + decimal, '.10f')

		# print("stardate for", year, day_of_year, hour)
		# print("error:", error, "in hours:", error_hours)
		return stardate

	#Called when executing this as a functor.
	def __call__(this):
		print(EOT.GetStardate())

