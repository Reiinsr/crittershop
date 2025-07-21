import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContactInfo {
  google_maps_url: string;
  phone_number: string;
  email: string;
}

export default function Contact() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    google_maps_url: '',
    phone_number: '',
    email: ''
  });

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .single();
      
      if (error) throw error;
      if (data) {
        setContactInfo(data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground">
            Get in touch with us for any questions about our animal products
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contactInfo.phone_number ? (
                <a 
                  href={`tel:${contactInfo.phone_number}`}
                  className="text-lg hover:text-primary transition-colors"
                >
                  {contactInfo.phone_number}
                </a>
              ) : (
                <p className="text-muted-foreground">Phone number not available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contactInfo.email ? (
                <a 
                  href={`mailto:${contactInfo.email}`}
                  className="text-lg hover:text-primary transition-colors"
                >
                  {contactInfo.email}
                </a>
              ) : (
                <p className="text-muted-foreground">Email not available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {contactInfo.google_maps_url && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={contactInfo.google_maps_url}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Store Location"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {!contactInfo.google_maps_url && !contactInfo.phone_number && !contactInfo.email && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Contact information is being updated. Please check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}