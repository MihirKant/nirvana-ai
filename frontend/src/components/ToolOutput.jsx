import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ToolOutput = ({ toolName, output }) => {
    if (toolName === 'scan_network') {
        const lines = output.split('\n');
        const arpRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F-]{17})\s+(\w+)/;
        const devices = [];

        lines.forEach(line => {
            const match = line.match(arpRegex);
            if (match) {
                devices.push({ ip: match[1], mac: match[2], type: match[3] });
            }
        });

        if (devices.length > 0) {
            return (
                <div className="tool-output">
                    <strong>[Network Scan Results]</strong>
                    <div className="network-table" style={{
                        width: '100%',
                        marginTop: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--accent-color)' }}>IP Address</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--accent-color)' }}>MAC Address</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--accent-color)' }}>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.map((device, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <td style={{ padding: '8px 12px' }}>{device.ip}</td>
                                        <td style={{ padding: '8px 12px' }}>{device.mac}</td>
                                        <td style={{ padding: '8px 12px' }}>{device.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    } else if (toolName === 'get_morning_briefing' || toolName === 'search_web') {
        // Handle News/Search Results
        // Format: "- Title: Link" or "- Title: Link\n Body"
        // We'll parse it similarly to the original script
        const entries = output.split('- ').filter(e => e.trim());
        const newsItems = [];

        entries.forEach(entry => {
            const lines = entry.split('\n');
            const firstLine = lines[0];
            const body = lines.slice(1).join('\n');

            // Check for link
            const parts = firstLine.split(': http');
            if (parts.length > 1) {
                const title = parts[0];
                const link = 'http' + parts.slice(1).join(': http');
                newsItems.push({ title, link, body });
            } else {
                // Just text
                newsItems.push({ title: firstLine, link: null, body });
            }
        });

        if (newsItems.length > 0) {
            return (
                <div className="tool-output">
                    <strong>[{toolName === 'get_morning_briefing' ? 'Morning Briefing' : 'Search Results'}]</strong>
                    <div className="news-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                        {newsItems.map((item, index) => (
                            <div key={index} className="news-card" style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '12px',
                                borderRadius: '8px',
                                borderLeft: '3px solid var(--accent-color)',
                                transition: 'transform 0.2s'
                            }}>
                                {item.link ? (
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
                                        color: '#fff',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>{item.title}</a>
                                ) : (
                                    <span style={{ fontWeight: 500, display: 'block', marginBottom: '4px' }}>{item.title}</span>
                                )}
                                {item.body && <div className="source" style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.6)' }}>{item.body}</div>}
                                {!item.body && <div className="source" style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.6)' }}>Source: External</div>}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    } else if (toolName === 'system_health') {
        const cpuMatch = output.match(/CPU: ([\d.]+)%/);
        const ramMatch = output.match(/RAM: ([\d.]+)%/);
        const batteryMatch = output.match(/Battery: (.*)/);

        return (
            <div className="tool-output">
                <strong>[System Health]</strong>
                <div className="health-stats" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '10px',
                    marginTop: '10px'
                }}>
                    {cpuMatch && (
                        <div className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                            <div className="stat-label" style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '5px' }}>CPU Usage</div>
                            <div className="stat-value" style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'var(--accent-color)' }}>{cpuMatch[1]}%</div>
                            <div className="progress-bar" style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                <div className="progress-fill" style={{ height: '100%', background: 'var(--accent-color)', width: `${cpuMatch[1]}%` }}></div>
                            </div>
                        </div>
                    )}
                    {ramMatch && (
                        <div className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                            <div className="stat-label" style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '5px' }}>RAM Usage</div>
                            <div className="stat-value" style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'var(--accent-color)' }}>{ramMatch[1]}%</div>
                            <div className="progress-bar" style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                <div className="progress-fill" style={{ height: '100%', background: 'var(--accent-color)', width: `${ramMatch[1]}%` }}></div>
                            </div>
                        </div>
                    )}
                    {batteryMatch && (
                        <div className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                            <div className="stat-label" style={{ fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '5px' }}>Battery</div>
                            <div className="stat-value" style={{ fontSize: '1em', fontWeight: 'bold', color: 'var(--accent-color)' }}>{batteryMatch[1]}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default Markdown rendering for other tools or fallbacks
    return (
        <div className="tool-output">
            <strong>[{toolName}]</strong>
            <div className="markdown-body" style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            </div>
        </div>
    );
};

export default ToolOutput;
