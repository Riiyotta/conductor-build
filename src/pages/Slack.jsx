import { Link } from 'react-router-dom'
import PageShell from '../components/pages/PageShell.jsx'
import PageContainer from '../components/pages/PageContainer.jsx'
import PageHeader from '../components/pages/PageHeader.jsx'
import Prose, { ProseHeading } from '../components/pages/Prose.jsx'

// CLONE_SPEC_PAGES §4 /slack (copy verbatim from recon/pages/content/slack.html)
export default function Slack() {
  return (
    <PageShell
      title="Conductor for Slack | Conductor"
      description="Let the coding agents in your Conductor cloud workspaces search Slack, read threads, and post updates, acting as you."
    >
      <PageContainer>
        <PageHeader
          title="Conductor for Slack"
          lead="Let the coding agents in your Conductor cloud workspaces search Slack, read threads, and post updates, acting as you."
        />
        <Prose className="mt-10">
          <p>
            Conductor runs coding agents like Claude Code and Codex in parallel, each in its own isolated cloud workspace.
            Conductor for Slack connects Slack's MCP server to those workspaces, so agents can search messages, read
            channels and threads, send messages, and work with canvases and lists. Everything runs as you, with your Slack
            permissions.
          </p>
          <img src="/assets/pages/slack/slack-search.png" alt="An agent searching Slack from a Conductor chat" width="1360" height="944" />
          <ProseHeading as="h2" id="connect-slack">
            Connect Slack
          </ProseHeading>
          <ol>
            <li>
              <Link to="/">Download Conductor</Link> and sign in.
            </li>
            <li>
              Open <strong>Settings → MCP servers</strong>, select <strong>Slack</strong>, and click{' '}
              <strong>Connect</strong>.
            </li>
            <li>
              Authorize in your browser. Slack shows the permissions you're granting and confirms the connection, and
              Conductor shows Slack as <strong>Connected</strong>.
            </li>
          </ol>
          <p>
            Slack tools are picked up when a cloud workspace starts. Create or restart a cloud workspace, then ask an agent
            something like "Search Slack for the latest discussion about the checkout bug and summarize it." To disconnect,
            open <strong>Settings → MCP servers</strong>.
          </p>
          <ProseHeading as="h2" id="privacy-and-support">
            Privacy and support
          </ProseHeading>
          <p>
            Conductor stores your Slack authorization only to make requests on your behalf, and disconnecting revokes it.
            Chats in cloud workspaces, including anything agents read from Slack, are stored on Conductor's servers. See
            the <Link to="/privacy">Privacy Notice</Link> and <Link to="/terms">Terms of Service</Link>.
          </p>
          <p>
            Questions? Email <a href="mailto:support@conductor.build">support@conductor.build</a>.
          </p>
        </Prose>
      </PageContainer>
    </PageShell>
  )
}
