'use strict'

import fs from 'fs'
const dataDirectory = process.env.DATA_DIRECTORY || 'data'

export default {
	listInstalledApps: (): string[] => fs.readdirSync(dataDirectory).map((it: string) => it.substring(0, it.length - 5)),
	dataDirectory
}
