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

        artist, song = await songdetails(search_query)
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
            print('check1')

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

# @router.get("/search")
# async def search(query: str):
#     try:

#         video_id = await search2hls(query)
#         print('search2hls finished')
#         song_details = await songdetails(query)
#         print('songdetails finished')
#         return {"id": video_id, "hls":True, "artist" : song_details[0], "song": song_details[1]}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# @router.get("/media")
# async def media(id: str):
#     try:
#         url = await streaming(id)

#         return {"file":url}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


@router.get("/home")
async def home():    
    return{"message": "hello home"}



