import { gunzipSync } from 'node:zlib'

function sendJson(res, status, payload) {
  res.setHeader('Cache-Control', 'private, no-store')
  return res.status(status).json(payload)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'method_not_allowed' })

  const sessionId = String(req.query?.sessionId || '').trim()
  const authorization = req.headers.authorization
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!sessionId || !authorization || !supabaseUrl || !publishableKey) {
    return sendJson(res, 401, { error: 'unauthorized' })
  }

  const headers = {
    apikey: publishableKey,
    Authorization: authorization,
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers })
  if (!userResponse.ok) return sendJson(res, 401, { error: 'unauthorized' })

  const workspaceResponse = await fetch(`${supabaseUrl}/rest/v1/pt_member_workspaces?select=member_id,payload`, { headers })
  if (!workspaceResponse.ok) return sendJson(res, 403, { error: 'forbidden' })

  const workspaces = await workspaceResponse.json()
  const canAccessSession = Array.isArray(workspaces)
    && workspaces.some((workspace) => (workspace.payload?.sessions || []).some((session) => session.id === sessionId))

  if (!canAccessSession) return sendJson(res, 404, { error: 'not_found' })

  try {
    const videoMap = JSON.parse(process.env.NOTION_VIDEO_MAP_JSON || '{}')
    const videoUrls = Array.isArray(videoMap[sessionId]) ? videoMap[sessionId] : []
    const contentMap = process.env.NOTION_SESSION_CONTENT_B64
      ? JSON.parse(gunzipSync(Buffer.from(process.env.NOTION_SESSION_CONTENT_B64, 'base64')).toString('utf8'))
      : {}
    const contentBlocks = Array.isArray(contentMap[sessionId]) ? contentMap[sessionId] : []
    return sendJson(res, 200, { videoUrls, contentBlocks })
  } catch {
    return sendJson(res, 500, { error: 'video_map_unavailable' })
  }
}
