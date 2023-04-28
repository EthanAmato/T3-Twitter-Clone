import { useUser } from '@clerk/nextjs'
import React from 'react'

export const CreatePostWizard = () => {
    const { user } = useUser();
    console.log(user)
    if (!user) return null;

    return (
        <div className='flex w-full gap-3'>
            <img className='rounded-full w-14 h-14' src={user.profileImageUrl} alt="Profile Image"/>
            <input className='p-2 bg-transparent outline-none grow' placeholder='Speak your truth!'/>
        </div>
    )
}
