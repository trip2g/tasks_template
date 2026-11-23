namespace $ {

	const opening = /^---\r?\n/

	function block(content: string) {
		const start = content.match(opening)
		if (!start) return null

		const closing = /^(---|\.\.\.)[ \t]*(\r?\n|$)/gm
		closing.lastIndex = start[0].length

		const found = closing.exec(content)
		if (!found) return null

		return content.slice(0, found.index)
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
		const head = block(content)
		if (head === null) return null

		const name = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		const found = head.match(new RegExp(`^${name}:[ \\t]*(.*?)\\r?$`, 'm'))
		if (!found) return null

		const value = decode(found[1])
		return value === '' || value === '~' || value === 'null' ? null : value
	}

}
