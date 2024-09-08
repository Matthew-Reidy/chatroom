import json
import time
import os 
import boto3


TBL_NAME = "connected_users"

DYANMO_CLIENT = boto3.client('dynamodb')

API_CLIENT = boto3.client('apigatewaymanagementapi', endpoint_url=os.getenv("CALLBACK_URL"))

def lambda_handler(event, context):
    
    connectionId : str = event["requestContext"]["connectionId"]

    match event["requestContext"]["eventType"]:
        
        case "CONNECT":

            enrollUser(event)
            
        case "DISCONNECT":
            # handles manual user disconnects
            deleteUser(connectionId)
            
        case "MESSAGE":

            if isValidUserSession(connectionId):
                 print("valid session...distributing messages")
                 sendMessage(event["body"])

    return {
        "statusCode": 200
    }

def isValidUserSession(connectionId : str) -> bool:

    now = int(time.time())

    try: 
        
        query = DYANMO_CLIENT.get_item(
            TableName=TBL_NAME,
            Key={
                'connectionId': {'S': connectionId}
            }
        )

        expires_at = query['Item']['expires_at']['N']

        if now >= int(expires_at):
            forceDisconnect(connectionId)
            return False
        
        return True

    except KeyError as e:
        print(e)
        return False

def enrollUser(context) -> None:

    try:

        #user sessions persist for 1 hour only. After that hour sessions are purged 
        expires_at = context["requestContext"]["requestTimeEpoch"] + 3600

        DYANMO_CLIENT.put_item(
            TableName=TBL_NAME,
            Item={
                'connectionId':{'S' : context["requestContext"]["connectionId"]},
                'expires_at':{'N': str(expires_at)},
                'username':{'S': context["queryStringParameters"]["username"]}
            }
        )

    except Exception as e:
        #if any error is thrown the server forces a disconnect
        forceDisconnect(context["requestContext"]["connectionId"])
        print(e)

#Forces a diconnect if a number of conditions are met
def forceDisconnect(connectionId : str):
    try:

        API_CLIENT.delete_connection(ConnectionId=connectionId)
        
        deleteUser(connectionId)

    except Exception as e:
        print(e)

def sendMessage(body):

    try:
       
       users = getConnectedUserList()

       for user in users:
           
            API_CLIENT.post_to_connection(
                                        Data=json.dumps(body).encode('utf-8'), 
                                        ConnectionId=user['connectionId']['S']          
                                        )
            
    except Exception as e:
        print(e)

def getConnectedUserList() :

    try:

        response = DYANMO_CLIENT.scan(TableName=TBL_NAME, ProjectionExpression='connectionId')
        print(f"Scanned Items: {response['Items']}")  
        return response['Items']
    
    except Exception as e :
        print(e)

def deleteUser(connectionId : str):
    
    try:

        DYANMO_CLIENT.delete_item(TableName=TBL_NAME, 
                                  Key={
                                      'connectionId': {'S': connectionId}
                                  })

    except Exception as e:
        print(e)