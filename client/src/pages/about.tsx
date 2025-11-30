import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-24">
      <div className="max-w-3xl mx-auto space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <h1 className="font-heading text-4xl md:text-6xl text-primary">The Artist</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Creating art that bridges the divine and the tangible.
          </p>
        </motion.div>

        <div className="aspect-[16/9] bg-muted rounded-2xl overflow-hidden">
          {/* Placeholder for artist photo */}
          <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
            <span className="text-muted-foreground">Artist Portrait</span>
          </div>
        </div>

        <div className="prose prose-lg prose-stone max-w-none font-sans">
          <p>
            Namaste. I am an artist deeply inspired by the spiritual heritage of India and the practice of Yoga. 
            My work is an exploration of inner silence, devotion, and the subtle energies that flow through us all.
          </p>
          <p>
            From childhood, I have been drawn to the forms of the divine—the gentle curve of Lord Ganesha's trunk, 
            the serene smile of Krishna, and the powerful stillness of meditative poses. Through my art, I attempt 
            to capture these fleeting moments of grace.
          </p>
          <p>
            Whether it is a charcoal sketch, a digital painting, or a clay sculpture, my process is always the same: 
            it begins with meditation. I believe that art should not just decorate a space, but transform its energy. 
            I hope my creations bring a sense of peace and sacredness to your home.
          </p>
        </div>
      </div>
    </div>
  );
}
