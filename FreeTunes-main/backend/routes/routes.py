from fastapi import APIRouter, HTTPException,WebSocket, WebSocketDisconnect
from controller.controller import search2hls
from controller.controller import streaming  
from controller.controller import songdetails
from controller.controller import get_id

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        search_query = await websocket.receive_text()
        updated_query = search_query[:-4]
        artist, song = await songdetails(updated_query)
        print(updated_query)
        id = await get_id(search_query)
        await websocket.send_json({
            "artist": artist,
            "song": song,
            "id" : id,
            "hls": False 
        })
        
        if id:
            await search2hls(search_query, websocket)
            hls_file_url = await streaming(id)
            print(hls_file_url)

            if hls_file_url:
                print('check2')
                await websocket.send_json({
                    "hls": True,
                    "file": hls_file_url
                })
        else:
            await websocket.send_text("No valid video ID found, aborting.")

    except Exception as e:
        # Handle any exceptions during the process
        await websocket.send_text(f"Error: {str(e)}")
    finally:
        await websocket.close()


@router.get("/home")
async def home():    
    return{"message": "hello home"}



