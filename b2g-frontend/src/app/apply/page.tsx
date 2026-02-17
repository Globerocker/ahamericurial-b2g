'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface MatchedOpportunity {
    id: string;
    title: string;
    agency: string;
    estimated_value: number;
    deadline: string;
    fitting_score: number;
    match_reasons: string[];
    required_capabilities: string[];
    naics: string;
    city: string;
    state: string;
}

export default function ContractorApplicationPage() {
    const [step, setStep] = useState<'form' | 'results'>('form');
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState<MatchedOpportunity[]>([]);

    const [formData, setFormData] = useState({
        company_name: '',
        email: '',
        primary_naics: '',
        city: '',
        state: '',
        certifications: [] as string[],
        capabilities: '',
        sam_registered: false,
    });

    const certificationOptions = [
        { id: '8a', label: '8(a) Business Development' },
        { id: 'sdvosb', label: 'Service-Disabled Veteran-Owned Small Business (SDVOSB)' },
        { id: 'wosb', label: 'Women-Owned Small Business (WOSB)' },
        { id: 'hubzone', label: 'HUBZone' },
        { id: 'sb', label: 'Small Business (SB)' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/match-opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to find matches');

            const data = await response.json();
            setMatches(data.matches || []);
            setStep('results');
        } catch (error) {
            console.error('Error finding matches:', error);
            alert('Failed to find matching opportunities. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-gray-600 bg-gray-50 border-gray-200';
    };

    if (step === 'results') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">Your Matched Opportunities</h1>
                        <p className="text-gray-600">
                            We found {matches.length} government contracts matched to your profile
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setStep('form')}
                            className="mt-4"
                        >
                            ← Refine Search
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        {matches.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <p className="text-gray-600 mb-4">
                                        No matching opportunities found at this time.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Try adjusting your NAICS code or capabilities, or check back later for new opportunities.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            matches.map((opp) => (
                                <Card key={opp.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl mb-2">{opp.title}</CardTitle>
                                                <CardDescription>{opp.agency}</CardDescription>
                                            </div>
                                            <div className={`px-4 py-2 rounded-lg border-2 ${getScoreColor(opp.fitting_score)}`}>
                                                <div className="text-2xl font-bold">{opp.fitting_score}%</div>
                                                <div className="text-xs">Fit Score</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Contract Value</span>
                                                <p className="text-lg font-semibold">{formatCurrency(opp.estimated_value)}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Deadline</span>
                                                <p className="text-lg font-semibold">{formatDate(opp.deadline)}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Location</span>
                                                <p className="text-lg">{opp.city}, {opp.state}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">NAICS</span>
                                                <p className="text-lg font-mono">{opp.naics}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <span className="text-sm font-medium text-gray-500 block mb-2">Why You Match</span>
                                            <div className="flex flex-wrap gap-2">
                                                {opp.match_reasons.map((reason, idx) => (
                                                    <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700">
                                                        {reason}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="text-sm font-medium text-gray-500 block mb-2">Required Capabilities</span>
                                            <div className="flex flex-wrap gap-2">
                                                {opp.required_capabilities.map((cap, idx) => (
                                                    <Badge key={idx} variant="outline">
                                                        {cap}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex gap-3">
                                            <Button className="flex-1">View Full Details</Button>
                                            <Button variant="outline">Save for Later</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">Find Government Contracts</h1>
                    <p className="text-gray-600">
                        Tell us about your business and we&apos;ll match you with relevant opportunities
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                        <CardDescription>Help us understand your capabilities and certifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="company_name">Company Name *</Label>
                                    <Input
                                        id="company_name"
                                        required
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        placeholder="Your company name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@company.com"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="primary_naics">Primary NAICS Code *</Label>
                                    <Input
                                        id="primary_naics"
                                        required
                                        value={formData.primary_naics}
                                        onChange={(e) => setFormData({ ...formData, primary_naics: e.target.value })}
                                        placeholder="541512"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        required
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Washington"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="state">State *</Label>
                                    <Input
                                        id="state"
                                        required
                                        maxLength={2}
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                        placeholder="DC"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Certifications</Label>
                                <div className="grid md:grid-cols-2 gap-3 mt-2">
                                    {certificationOptions.map((cert) => (
                                        <div key={cert.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={cert.id}
                                                checked={formData.certifications.includes(cert.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setFormData({
                                                            ...formData,
                                                            certifications: [...formData.certifications, cert.id],
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            certifications: formData.certifications.filter((c) => c !== cert.id),
                                                        });
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor={cert.id}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {cert.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="capabilities">Key Capabilities *</Label>
                                <textarea
                                    id="capabilities"
                                    required
                                    className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                                    value={formData.capabilities}
                                    onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                                    placeholder="Describe your key services and capabilities (e.g., IT services, cloud migration, cybersecurity, etc.)"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sam_registered"
                                    checked={formData.sam_registered}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, sam_registered: checked as boolean })
                                    }
                                />
                                <label
                                    htmlFor="sam_registered"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    I am registered in SAM.gov
                                </label>
                            </div>

                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                {loading ? 'Finding Matches...' : 'Find Matching Opportunities'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
