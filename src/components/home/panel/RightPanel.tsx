import ChatWidget from './ChatWidget';
import CreatePostBox from './CreatePostBox';

export default function RightPanel() {
  return (
    <div className="w-full h-full pb-4 pt-[74px] lg:px-6 flex flex-col gap-6">
      <CreatePostBox />
      <ChatWidget />
    </div>
  );
}
