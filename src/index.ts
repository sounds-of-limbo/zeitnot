import { SOLNumber } from "@sounds.of.limbo/extensions/dist/standalone/Number"

export interface ZeitnotProps {
	targetOffset?: string | number	
}

export type ZeitnotInput = string | number | Date

export interface ZeitnotCompareResult {
	isEqual: boolean
	isGreater: boolean
	isLess: boolean
}

const offsetRegex = /^[+-](0[0-9]|1[0-2])\:[0-5][0-9]$/g
const formatRegex = /(D{1,2}|M{4}|M{2,3}|Y{4}|Y{2}|h{1,2}|m{2}|s{2}|T)/g

const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
]

export class Zeitnot {
	static defaultOffset
		: string | number
		= "+00:00"

	static defaultFormat
		: string
		= "DD MMM YYYY, hh:mm:ss [T]"

	static parseOffset = (
		offset: string
	): number => {
		if (!offsetRegex.test(offset)) {
			console.warn(`Timezone offset "${offset}" does not match the format. Returned 0 as offset`)
			return 0
		}

		const sign = offset.slice(0, 1)
		const [ hours = 0, minutes = 0 ] = offset.slice(1).split(":").map(Number)
		return (new SOLNumber(hours).as("hours").to("minutes") + minutes) * (sign == "-" ? -1 : 1)
	}

	private date
		: Date
		= new Date()

	private props
		: Required<ZeitnotProps>
		= {
			targetOffset: Zeitnot.defaultOffset,
		}

	private get offset(): number {
		return typeof this.props.targetOffset == "number"
			? this.props.targetOffset
			: Zeitnot.parseOffset(this.props.targetOffset)
	}

	constructor(
		from: ZeitnotInput,
		props: ZeitnotProps = {},
	) {
		this.props = {
			...this.props,
			...props,
		}

		if (typeof from == "string") {
			this.date = new Date(from)
			if (isNaN(this.date.getTime()))
				throw new Error("Zeitnot: Bad string input")
		} else if (typeof from == "number") {
			this.date.setTime(from)
		} else {
			this.date.setTime(from.getTime())
		}
	}

	get time(): number {
		return this.date.getTime()
	}

	get formattedOffset(): string {
		return new SOLNumber(this.offset).as("minutes").toTimeString()
	}

	comparedTo = (
		input: ZeitnotInput | Zeitnot
	): ZeitnotCompareResult => {
		if (input instanceof Zeitnot) {
			return {
				isEqual: this.time == input.time,
				isGreater: this.time > input.time,
				isLess: this.time < input.time,
			}
		} else {
			const comparable = new Zeitnot(input)
			return this.comparedTo(comparable)
		}
	}

	toString = (
		format: string = Zeitnot.defaultFormat,
	): string => {
		const date = new Date(this.time)
		date.setUTCMinutes(date.getUTCMinutes() + this.offset)

		var year = date.getUTCFullYear(),
			monthIndex = date.getUTCMonth(),
			day = date.getUTCDate(),
			hours = date.getUTCHours(),
			minutes = date.getUTCMinutes(),
			seconds = date.getUTCSeconds()

		return format.replace(formatRegex, group => {
			switch (group) {
				case "D":
					return `${day}`
				case "DD":
					return `${day}`.padStart(2, "0")

				case "MMMM":
					return monthNames[monthIndex] || group
				case "MM":
					return `${monthIndex + 1}`.padStart(2, "0")
				case "MMM":
					return monthNames[monthIndex]?.slice(0, 3) || group

				case "YYYY":
					return `${year}`
				case "YY":
					return `${year}`.padStart(4, "0").slice(2)

				case "h":
					return `${hours}`
				case "hh":
					return `${hours}`.padStart(2, "0")

				case "mm":
					return `${minutes}`
				
				case "ss":
					return `${seconds}`

				case "T":
					return this.formattedOffset
				default:
					return group
			}
		})
	}
}