import axios from 'axios';
import { showAlert } from './alerts';
// Type is either password or data
export const updateSettings = async(data, type) => {
    try{
        const url = type === 'password' ? 'http://127.0.0.1:3000/api/v1/users/updatePassword' : 'http://127.0.0.1:3000/api/v1/users/updateData'
        console.log(data);
        const result = await axios({
            method: 'PATCH',
            url,
            data
        });
        if(result.data.status === 'success'){
            showAlert('success', `Update ${type.toUpperCase()} successfully`);
            location.reload(true);
        }
    }
    catch(error){
        showAlert('error', error.response.data.message);
    }
}