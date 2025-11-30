import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Thank you for your message. We will get back to you soon.",
    });
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl md:text-5xl text-primary">Get in Touch</h1>
            <p className="text-muted-foreground text-lg">
              Interested in a commission, or have a question about a piece? I'd love to hear from you.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-xl mb-2">Studio</h3>
              <p className="text-muted-foreground">
                123 Art Avenue, Creative District<br/>
                Mumbai, India 400001
              </p>
            </div>
            <div>
              <h3 className="font-heading text-xl mb-2">Email</h3>
              <p className="text-muted-foreground">hello@pranaartgallery.com</p>
            </div>
            <div>
              <h3 className="font-heading text-xl mb-2">Social</h3>
              <p className="text-muted-foreground">@pranaartgallery</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-8 md:p-10 rounded-2xl border border-border shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" required className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" required className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Commission inquiry, Shipping question, etc." required className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="How can we help you?" className="min-h-[150px] bg-background" required />
            </div>
            <Button type="submit" className="w-full rounded-full h-12 text-base">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
