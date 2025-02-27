


import { MdDelete } from "react-icons/md";
import { Doc, Id } from '@/convex/_generated/dataModel'
import { useNavigation } from '@/lib/NavigationProvider';
import { useRouter } from 'next/navigation';
import React from 'react'
import { Button } from '../ui/button';

function ChatRow({
    chat,
    onDelete,
    
}:{
    chat:Doc<"chats">;
    onDelete: (id: Id<"chats">) => void;

}) {
    const router =useRouter()
    const {closeMobileNav} = useNavigation()


   const handleClick=() =>{
    router.push(`/dashboard/chat/${chat._id}`)
    closeMobileNav()
   } 

  return (
  <div className='group rounded-xl border border-gray-200/30 bg-white/50 backdrop-blur-sm hover:bg-gray-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md
  '
  onClick={handleClick}>
<div className='p-3'>
    <div className='flex justify-between items-start'>
Chat
<Button
className=' bg-white hover:bg-gray-100'
onClick={(e) => {e.stopPropagation();onDelete(chat._id)}} >
<MdDelete className="text-red-500"/>
</Button>
    </div>
   
</div>
  </div>

  )
}

export default  ChatRow