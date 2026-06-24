import WobblyCard from '@/components/WobblyCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <WobblyCard className="max-w-md w-full text-center p-8">
        <h1 className="font-marker text-6xl font-bold mb-4">404</h1>
        <h2 className="font-hand text-xl mb-6">页面找不到啦</h2>
        <p className="text-muted-foreground mb-8 font-hand">你访问的页面可能已经被移走或者删除了</p>
        <Button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mx-auto"
        >
          <Home className="size-4" />
          返回首页
        </Button>
      </WobblyCard>
    </div>
  );
};

export default NotFound;
