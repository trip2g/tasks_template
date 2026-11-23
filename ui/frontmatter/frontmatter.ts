namespace $ {

	export type $trip2gtasks_frontmatter_patch = {
		find: string
		replace: string
	}

	const opening = /^---\r?\n/

	function block_end(content: string) {
		const start = content.match(opening)
		if (!start) return -1

		const closing = /^(---|\.\.\.)[ \t]*(\r?\n|$)/gm
		closing.lastIndex = start[0].length

		const found = closing.exec(content)
		if (!found) return -1

		return found.index + found[0].length
	}

	function line_pattern(key: string) {
		const name = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		return new RegExp(`^${name}:([ \\t]*)(.*?)(\\r?)$`, 'm')
	}

	function plain_safe(value: string) {
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true
		if (value === '' || value.trim() !== value) return false
		if (/^[-?:,\[\]{}#&*!|>'"%@`]/.test(value)) return false
		if (/: |\s#/.test(value)) return false
		if (/^(true|false|yes|no|on|off|null|~|[-+.\d][\d._:eE+-]*)$/i.test(value)) return false
		return true
	}

	function quote_double(value: string) {
		return JSON.stringify(value)
	}

	function quote_single(value: string) {
		return `'${value.replace(/'/g, "''")}'`
	}

	function encode(value: string, previous: string | null) {
		if (previous?.startsWith('"')) return quote_double(value)
		if (previous?.startsWith("'")) return quote_single(value)
		return plain_safe(value) ? value : quote_double(value)
	}

	function decode(raw: string) {
		const text = raw.trim()
		if (text.startsWith('"')) {
			try {
				return JSON.parse(text) as string
			} catch {
				return text.slice(1, -1)
			}
		}
		if (text.startsWith("'")) return text.slice(1, -1).replace(/''/g, "'")
		return text.replace(/\s+#.*$/, '')
	}

	export function $trip2gtasks_frontmatter_value(content: string, key: string): string | null {
		const end = block_end(content)
		if (end < 0) return null

		const found = content.slice(0, end).match(line_pattern(key))
		if (!found) return null

		return decode(found[2])
	}

	export function $trip2gtasks_frontmatter_set(content: string, key: string, value: string): $trip2gtasks_frontmatter_patch | null {
		const end = block_end(content)
		if (end < 0) return null

		const find = content.slice(0, end)
		const found = find.match(line_pattern(key))

		if (found) {
			const line = `${key}:${found[1] || ' '}${encode(value, found[2].trim() || null)}${found[3]}`
			const replace = find.slice(0, found.index!) + line + find.slice(found.index! + found[0].length)
			return { find, replace }
		}

		const newline = find.includes('\r\n') ? '\r\n' : '\n'
		const closing = find.match(/(---|\.\.\.)[ \t]*(\r?\n)?$/)!
		const before = find.slice(0, closing.index!)
		const replace = `${before}${key}: ${encode(value, null)}${newline}${find.slice(closing.index!)}`

		return { find, replace }
	}

}
