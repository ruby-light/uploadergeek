import {Button} from 'antd';
import {sendLoginNotification} from 'frontend/src/context/LoginNotificationHandler';

export const AnonymousLoginPage = () => {
    return (
        <>
            <h3>Please log in</h3>
            <div>
                <Button onClick={sendLoginNotification}>Login with II</Button>
            </div>
        </>
    );
};
