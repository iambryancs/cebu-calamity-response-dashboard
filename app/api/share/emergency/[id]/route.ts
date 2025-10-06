import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch emergency data from your main API
    const emergencyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emergencies`);
    
    if (!emergencyResponse.ok) {
      throw new Error('Failed to fetch emergency data');
    }
    
    const emergencyData = await emergencyResponse.json();
    
    if (!emergencyData.success || !emergencyData.data) {
      throw new Error('Invalid emergency data');
    }
    
    // Find the specific emergency by ID
    const emergency = emergencyData.data.find((e: any) => e.id === params.id);
    
    if (!emergency) {
      return NextResponse.json({ error: 'Emergency not found' }, { status: 404 });
    }
    
    // Generate dynamic content based on emergency data
    const hasRelief = emergency.hasReliefAction;
    const distanceText = emergency.reliefActionDistance && emergency.reliefActionDistance < 1 
      ? `${(emergency.reliefActionDistance * 1000).toFixed(0)}m away`
      : emergency.reliefActionDistance ? `${emergency.reliefActionDistance.toFixed(1)}km away` : '';
    
    const title = hasRelief 
      ? `Emergency in ${emergency.placename} - Relief Available ${distanceText}!`
      : `URGENT: Emergency in ${emergency.placename} needs immediate relief!`;
    
    const description = hasRelief
      ? `${emergency.numberOfPeople} people affected. Relief is available ${distanceText}. Help coordinate relief efforts.`
      : `${emergency.numberOfPeople} people affected. No relief available yet - please help!`;
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Randomly select one of the share images
    const shareImages = ['share_a.jpg', 'share_b.jpg', 'share_c.jpg', 'share_d.jpg', 'share_e.jpg'];
    const randomImage = shareImages[Math.floor(Math.random() * shareImages.length)];
    
    return NextResponse.json({
      title,
      description,
      url: `${baseUrl}/share/emergency/${params.id}`,
      image: `${baseUrl}/${randomImage}`,
      emergency
    });
    
  } catch (error) {
    console.error('Error fetching emergency data for sharing:', error);
    return NextResponse.json({ error: 'Failed to fetch emergency data' }, { status: 500 });
  }
}
