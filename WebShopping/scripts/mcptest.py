import asyncio,sys
sys.stdout.reconfigure(encoding='utf-8')
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
D=sys.argv[1]
async def main():
    p=StdioServerParameters(command=D+r"\.venv\Scripts\python.exe",args=["server.py"],cwd=D)
    async with stdio_client(p) as (r,w):
        async with ClientSession(r,w) as s:
            await s.initialize()
            t=await s.list_tools(); print("TOOLS:",[x.name for x in t.tools])
            for name,args in [("get-transcript",{"video_url":"https://www.youtube.com/watch?v=j6yHMCTb-YA"}),("store-video-info",{"video_url":"https://www.youtube.com/watch?v=j6yHMCTb-YA","metadata":{"title":"RX 9060 XT review"}}),("search-transcripts",{"query":"gaming performance of the graphics card","limit":1})]:
                res=await s.call_tool(name,args); print(name,"->",res.content[0].text[:500] if res.content else res)
asyncio.run(main())
